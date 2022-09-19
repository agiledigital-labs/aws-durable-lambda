import { handlerPath } from '@agiledigital/aws-durable-lambda';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'create-task/{functionName}',
      },
    },
  ],
};
