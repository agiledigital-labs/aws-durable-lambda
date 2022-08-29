import { handlerPath } from '@agiledigital/aws-durable-lambda';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  timeout: 900,
  events: [
    {
      sqs: { arn: { 'Fn::GetAtt': ['FunctionTaskOutputQueue', 'Arn'] } },
      batchSize: 1,
    },
  ],
};
