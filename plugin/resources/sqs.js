const sqs = (stage) => ({
  FunctionTaskQueue: {
    Type: 'AWS::SQS::Queue',
    Properties: {
      QueueName: `FunctionTaskQueue-${stage}`,
      RedrivePolicy: {
        deadLetterTargetArn: {
          'Fn::GetAtt': ['FunctionTaskDeadLetterQueue', 'Arn'],
        },
        maxReceiveCount: 5,
      },
      VisibilityTimeout: 1000
    },
  },
  FunctionTaskDeadLetterQueue: {
    Type: 'AWS::SQS::Queue',
    Properties: {},
  },
  FunctionTaskOutputQueue: {
    Type: 'AWS::SQS::Queue',
    Properties: {
      QueueName: `FunctionTaskOutputQueue-${stage}`,
      RedrivePolicy: {
        deadLetterTargetArn: {
          'Fn::GetAtt': ['FunctionTaskOutputDeadLetterQueue', 'Arn'],
        },
        maxReceiveCount: 5,
      },
      VisibilityTimeout: 1000
    },
  },
  FunctionTaskOutputDeadLetterQueue: {
    Type: 'AWS::SQS::Queue',
    Properties: {},
  }
});

module.exports = sqs;
