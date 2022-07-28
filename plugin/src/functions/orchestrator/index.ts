import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  timeout: 900,
  events: [
    {
      sqs: { arn: { 'Fn::GetAtt': ['FunctionTaskQueue', 'Arn'] } },
      batchSize: 1,
    },
  ],
};
