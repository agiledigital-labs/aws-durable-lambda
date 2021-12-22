const functions = (stage) => ({
  getTask: {
    name: `aws-durable-lambda-${stage}-get-task`,
    handler: `plugin/functions/getTask/handler.getTask`,
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
    name: `aws-durable-lambda-${stage}-orchestrator`,
    handler: `plugin/functions/orchestrator/handler.orchestrator`,
    timeout: 900,
    events: [
      {
        sqs: { arn: { 'Fn::GetAtt': ['FunctionTaskQueue', 'Arn'] } },
        batchSize: 1,
      }
    ]
  },
  reporter: {
    name: `aws-durable-lambda-${stage}-reporter`,
    handler: `plugin/functions/reporter/handler.reporter`,
    timeout: 900,
    events: [
      {
        sqs: { arn: { 'Fn::GetAtt': ['FunctionTaskOutputQueue', 'Arn'] } },
        batchSize: 1,
      }
    ]
  },
  submitTask: {
    name: `aws-durable-lambda-${stage}-submit-task`,
    handler: `plugin/functions/submitTask/handler.submitTask`,
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
