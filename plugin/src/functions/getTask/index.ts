import { handlerPath } from '@agiledigital/aws-durable-lambda';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: 'task/{taskId}',
      },
    },
  ],
};
