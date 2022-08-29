'use strict';

const { join, extname, dirname } = require('path');
const dynamodb = require('./resources/dynamodb');
const sqs = require('./resources/sqs');
const { copy, remove, readdir, stat, readFile } = require('fs-extra');
const archiver = require('archiver');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');
const {
  hasWebpackPlugin,
  hasJetpackPlugin,
  hasEsbuildPlugin,
  forceExcludeDepsFromWebpack,
  forceExcludeStagingDirectoryFromJetpack,
  forceExcludeDepsFromEsbuild,
  forceExcludeStagingDirectoryFromServerless,
} = require('./libs/env');

import iam from './resources/iam';
import functions from './resources/functions';
import layers from './resources/layers';

// Future work: replace with native promise version from 'stream/promises'
// when min node version is 16+
const pipelineAsync = promisify(pipeline);

/**
 * The name of the directory where the plugin will store intermediate files
 * during packaging/deployment
 */
const functionStagingDirectoryName = '.adl';
/**
 * The name of the layer which will store the plugin code.
 * This is the name that Serverless uses in its config,
 * when it generates the CloudFormation files, the logical
 * name is different (@see baseLayerCfLogicalName)
 */
const baseLayerName = 'AwsDurableLambdaBase';
/**
 * The CloudFormation logical name used to refer to the layer
 * when injecting raw CloudFormation snippets (e.g. you can
 * use this name in 'Ref' and 'GetAtt' blocks)
 */
const baseLayerCfLogicalName = `${baseLayerName}LambdaLayer`;
/**
 * The directory where the plugin would be installed under the
 * node_modules. (The same as the package name)
 */
const pluginModulePath = '@agiledigital/aws-durable-lambda';
/**
 * The location in the layer where you need to put node modules
 * for them to be picked up automatically by node in import/require calls
 */
const layerModulesPath = 'nodejs/node_modules';

/**
 * Gets the absolute path to the directory where the plugin will store intermediate files
 * during packaging/deployment.
 * @param {*} serverless a reference to the serverless instance
 * @returns the absolute path to the staging directory
 */
const getFunctionStagingDirectory = (serverless) => {
  const basePath = serverless.config.servicePath;
  return join(basePath, functionStagingDirectoryName);
};

/**
 * Takes a thunk that returns a promise and wraps it in
 * another thunk so that any errors it throws will be
 * wrapped in a Serverless friendly error type.
 * @param {*} serverless a reference to the serverless instance
 * @param {*} asyncFn an async thunk to execute
 */
const ensureServerlessErrorFor = (serverless, asyncFn) => async () => {
  try {
    await asyncFn();
  } catch (error) {
    // Regular errors will abort the package/deploy but will not show anything
    // Wrapping the error in a Serverless specific error class makes Serverless
    // log the error in a consistent way
    throw new serverless.classes.Error(error);
  }
};

/**
 * The filter used when copying over the boilerplate files to the .adl/ staging dir.
 *
 * Will ensure that only Javascript files are copied and not extraneous files (e.g. .map files)
 * that confuse serverless-webpack and cause it to show warnings.
 *
 * @param {*} src the source path of the file that is being copied
 * @returns true if the file should be copied, otherwise false
 */
const filterOutAnythingButJs = (src) => {
  const extension = extname(src);
  // Checking for empty string is the easiest way to determine if the src
  // is a directory (which we always want to allow so the copy will recurse)
  // We have control of the source directory and know we won't be putting any
  // files without extensions in there so it seems like a safe enough way to do
  // it without get fs.stat involved.
  return extension === '' || extension.toLocaleLowerCase() === '.js';
};

function addResources(serverless) {
  serverless.cli.log(`Injecting CloudFormation resources...`, pluginModulePath);

  const service = serverless.service.service;
  const stage = serverless.service.provider.stage || 'dist';
  const provider = serverless.service.provider;
  const functionStagingDirectory = getFunctionStagingDirectory(serverless);

  serverless.service.resources.Resources = {
    ...serverless.service.resources.Resources,
    ...sqs,
    ...dynamodb,
    ...iam,
  };

  serverless.cli.log(`Injecting serverless layer config...`, pluginModulePath);

  serverless.service.layers = {
    ...serverless.service.layers,
    ...layers(baseLayerName, functionStagingDirectoryName),
  };

  serverless.cli.log(
    `Injecting serverless function config...`,
    pluginModulePath
  );

  serverless.service.functions = {
    ...serverless.service.functions,
    ...functions(
      service,
      stage,
      functionStagingDirectoryName,
      baseLayerCfLogicalName,
      pluginModulePath
    ),
  };

  serverless.cli.log(`Injecting serverless iam config...`, pluginModulePath);

  serverless.service.provider.iam = {
    ...(provider.iam ?? {}),
    role: {
      ...(provider.iam?.role ?? {}),
      managedPolicies: [
        ...(provider.iam?.role?.managedPolicies ?? []),
        // Reference any of the IAM policies defined in CloudFormation
        ...Object.keys(iam).map((policyLogicalName) => ({
          Ref: policyLogicalName,
        })),
      ],
    },
  };

  serverless.cli.log(
    `Injecting serverless environment config...`,
    pluginModulePath
  );

  serverless.service.provider.environment = {
    ...serverless.service.provider.environment,
    FUNCTION_TASK_QUEUE_NAME: {
      'Fn::GetAtt': ['FunctionTaskQueue', 'QueueName'],
    },
    FUNCTION_TASK_OUT_PUT_QUEUE_NAME: {
      'Fn::GetAtt': ['FunctionTaskOutputQueue', 'QueueName'],
    },
    FUNCTION_TASK_OUTPUT_QUEUE_URL: { Ref: 'FunctionTaskOutputQueue' },
    FUNCTION_TASK_QUEUE_URL: { Ref: 'FunctionTaskQueue' },
    FUNCTION_TASK_TABLE_NAME: { Ref: 'FunctionTaskTable' },
  };
}

function patchPackagingOptions(serverless) {
  // As we have to support all the most popular serverless packaging plugins
  // we need a lot of workarounds as they all function slightly differently.

  serverless.cli.log(
    `Patching package->patterns to exclude files already included in aws-durable-lambda layer...`,
    pluginModulePath
  );

  forceExcludeStagingDirectoryFromServerless(
    serverless.service,
    functionStagingDirectoryName
  );

  if (hasWebpackPlugin(serverless.service)) {
    serverless.cli.log(
      `serverless-webpack detected. Will patch forceExclude to exclude files already included in aws-durable-lambda layer`,
      pluginModulePath
    );
    forceExcludeDepsFromWebpack(serverless.service, pluginModulePath);
  }

  if (hasJetpackPlugin(serverless.service)) {
    // Future work: remove this when serverless-jetpack is updated (tracked in issue #122)
    serverless.cli.log(
      `serverless-jetpack detected. Will patch package->include/exclude as it does not support the new 'patterns' syntax (see issue #122)`,
      pluginModulePath
    );
    forceExcludeStagingDirectoryFromJetpack(
      serverless.service,
      functionStagingDirectoryName
    );
  }

  if (hasEsbuildPlugin(serverless.service)) {
    serverless.cli.log(
      `serverless-esbuild detected. Will patch exclude to exclude files already included in aws-durable-lambda layer`,
      pluginModulePath
    );
    forceExcludeDepsFromEsbuild(serverless.service, pluginModulePath);
  }
}

async function cleanupBoilerplateFunctionCode(serverless) {
  const functionStagingDirectory = getFunctionStagingDirectory(serverless);
  serverless.cli.log(
    `Cleaning up boilerplate function code at [${functionStagingDirectory}]...`,
    pluginModulePath
  );
  await remove(functionStagingDirectory);
}

async function copyBoilerplateFunctionCode(serverless) {
  const functionStagingDirectory = getFunctionStagingDirectory(serverless);
  const basePath = serverless.config.servicePath;
  const source = join(basePath, `node_modules/${pluginModulePath}/lib`);
  const destination = join(functionStagingDirectory);
  serverless.cli.log(
    `Copying boilerplate function code from [${source}] to [${destination}]...`,
    pluginModulePath
  );
  await copy(source, destination, {
    filter: filterOutAnythingButJs,
  });
}

async function zipBoilerplateFunctionCode(serverless) {
  const functionStagingDirectory = getFunctionStagingDirectory(serverless);
  const libsDir = join(functionStagingDirectory, '@libs');
  const zipFile = join(functionStagingDirectory, 'adl-artifact.zip');
  serverless.cli.log(
    `Zipping boilerplate function code at [${libsDir}] to [${zipFile}]...`,
    pluginModulePath
  );

  const zip = archiver.create('zip');
  const output = createWriteStream(zipFile);

  const pipelineComplete = pipelineAsync(zip, createWriteStream(zipFile));

  const libsBundleFile = join(libsDir, 'index.js');
  const libsBundleContents = await readFile(libsBundleFile);
  const libsBundleStat = await stat(libsBundleFile);

  // Ensure file is executable if it is locally executable or
  // we force it to be executable if platform is windows
  // (Taken from serverless library zip-service.js)
  const mode =
    libsBundleStat.mode & 0o100 || process.platform === 'win32' ? 0o755 : 0o644;

  zip.append(libsBundleContents, {
    name: 'index.js',
    prefix: join(layerModulesPath, pluginModulePath),
    mode,
    date: new Date(0), // necessary to get the same hash when zipping the same content
  });

  zip.finalize();

  // The pipeline function will make sure that the stream has ended
  // and will propagate any errors without the need for explicit
  // event handlers
  await pipelineComplete;
}

class AWSDurableLambda {
  constructor(serverless) {
    this.hooks = {
      'after:package:initialize': ensureServerlessErrorFor(
        serverless,
        async () => {
          addResources(serverless);
          patchPackagingOptions(serverless);
          await cleanupBoilerplateFunctionCode(serverless);
          await copyBoilerplateFunctionCode(serverless);
          await zipBoilerplateFunctionCode(serverless);
        }
      ),
      'aws:deploy:finalize:cleanup': ensureServerlessErrorFor(
        serverless,
        async () => {
          await cleanupBoilerplateFunctionCode(serverless);
        }
      ),
    };
  }
}

module.exports = AWSDurableLambda;
