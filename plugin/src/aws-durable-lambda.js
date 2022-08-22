'use strict';

const { join, extname, dirname } = require('path');
const dynamodb = require('./resources/dynamodb');
const sqs = require('./resources/sqs');
const { copy, remove } = require('fs-extra');

import iam from './resources/iam';
import functions from './resources/functions';

const functionStagingDirectoryName = '.adl';
const getFunctionStagingDirectory = (serverless) => {
  const basePath = serverless.config.servicePath;
  return join(basePath, functionStagingDirectoryName);
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

  serverless.service.functions = {
    ...serverless.service.functions,
    ...functions(service, stage, functionStagingDirectoryName),
  };

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

async function cleanupBoilerplateFunctionCode(serverless) {
  const functionStagingDirectory = getFunctionStagingDirectory(serverless);
  serverless.cli.log(
    `[aws-durable-lambda] Cleaning up boilerplate function code at [${functionStagingDirectory}]...`
  );
  await remove(functionStagingDirectory);
}

async function copyBoilerplateFunctionCode(serverless) {
  const functionStagingDirectory = getFunctionStagingDirectory(serverless);
  const basePath = serverless.config.servicePath;
  const source = join(
    basePath,
    'node_modules/@agiledigital/aws-durable-lambda/lib/functions'
  );
  const destination = join(functionStagingDirectory, 'functions');
  serverless.cli.log(
    `[aws-durable-lambda] Copying boilerplate function code from [${source}] to [${destination}]...`
  );
  await copy(source, destination, {
    filter: filterOutAnythingButJs,
  });
}

class AWSDurableLambda {
  constructor(serverless) {
    this.hooks = {
      'after:package:initialize': async function () {
        addResources(serverless);
        await cleanupBoilerplateFunctionCode(serverless);
        return copyBoilerplateFunctionCode(serverless);
      },
      'after:package:createDeploymentArtifacts': async function () {
        await cleanupBoilerplateFunctionCode(serverless);
      },
    };
  }
}

module.exports = AWSDurableLambda;
