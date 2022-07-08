'use strict';

const { join } = require("path");
const dynamodb = require("./resources/dynamodb");
const functions = require("./resources/functions");
const sqs = require("./resources/sqs");
const { copy, remove } = require("fs-extra");

import {
  orchestratorIamPolicy,
  getTaskIamPolicy,
  reporterIamPolicy,
  submitTaskIamPolicy,
} from "./resources/iam";

const functionStagingDirectoryName = '.adl';
const getFunctionStagingDirectory = (serverless) => {
  const basePath = serverless.config.servicePath;
  return join(basePath, functionStagingDirectoryName);
};

function addResources(serverless) {
  const service = serverless.service.service;
  const stage = serverless.service.provider.stage || 'dist';
  const provider = serverless.service.provider;
  const functionStagingDirectory = getFunctionStagingDirectory(serverless);

  serverless.service.resources.Resources = {
    ...serverless.service.resources.Resources,
    ...sqs(stage),
    ...dynamodb(stage),
  };

  serverless.service.functions = {
    ...serverless.service.functions,
    ...functions(service, stage, functionStagingDirectoryName),
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
  await copy(source, destination);
}

class AWSDurableLambda {
  constructor(serverless) {
    this.hooks = {
      //this.serverless.config.servicePath
      'package:cleanup': async function () {
        await cleanupBoilerplateFunctionCode(serverless);
        return copyBoilerplateFunctionCode(serverless);
      },
      'package:finalize': async function () {
        await cleanupBoilerplateFunctionCode(serverless);
      },

      initialize: function () {
        addResources(serverless);
      },
    };
  }
}

module.exports = AWSDurableLambda;
