const functions = (service, stage, functionStagingDirectoryName) => ({

  getTask: {
    name: `${service}-adl-${stage}-get-task`,
    handler: `${functionStagingDirectoryName}/functions/getTask/handler.main`,
    events: [
      {
        http: {
          method: 'get',
          path: 'task/{taskId}'
        }
      }
    ]
  },
  orchestrator: {
    name: `${service}-adl-${stage}-orchestrator`,
    handler: `${functionStagingDirectoryName}/functions/orchestrator/handler.main`,
    timeout: 900,
    events: [
      {
        sqs: { arn: { 'Fn::GetAtt': ['FunctionTaskQueue', 'Arn'] } },
        batchSize: 1,
      }
    ]
  },
  reporter: {
    name: `${service}-adl-${stage}-reporter`,
    handler: `${functionStagingDirectoryName}/functions/reporter/handler.main`,
    timeout: 900,
    events: [
      {
        sqs: { arn: { 'Fn::GetAtt': ['FunctionTaskOutputQueue', 'Arn'] } },
        batchSize: 1,
      }
    ]
  },
  submitTask: {
    name: `${service}-adl-${stage}-submit-task`,
    handler: `${functionStagingDirectoryName}/functions/submitTask/handler.main`,
    events: [
      {
        http: {
          method: 'post',
          path: 'create-task/{functionName}'
        }
      }
    ]
  }
});

module.exports = functions;
