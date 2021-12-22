'use strict';

const dynamodb = require("./resources/dynamodb");
const functions = require("./resources/functions");
const sqs = require("./resources/sqs");

function addResources(serverless) {
  const stage = serverless.service.provider.stage || 'dist';

  serverless.service.resources.Resources = {
    ...serverless.service.resources.Resources,
    ...sqs(stage),
    ...dynamodb(stage)
  };

  serverless.service.functions = {
    ...serverless.service.functions,
    ...functions(stage)
  };

  serverless.service.provider.environment = {
    ...serverless.service.provider.environment,
    FUNCTION_TASK_QUEUE_NAME: `FunctionTaskQueue-${stage}`,
    FUNCTION_TASK_OUT_PUT_QUEUE_NAME: `FunctionTaskOutputQueue-${stage}`,
    FUNCTION_TASK_OUTPUT_QUEUE_URL: { Ref: 'FunctionTaskOutputQueue' },
    FUNCTION_TASK_QUEUE_URL: { Ref: 'FunctionTaskQueue' },
    FUNCTION_TASK_TABLE_NAME: `FunctionTaskTable-${stage}`
  };
}

class AWSDurableLambda {
  constructor(serverless) {
    this.hooks = {
      'initialize': function () { 
        addResources(serverless) 
      }
    }
  }
}

module.exports = AWSDurableLambda;
