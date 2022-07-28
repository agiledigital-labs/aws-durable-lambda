import { functionTaskTable } from '@libs/dynamodb';
import { SQSEvent } from 'aws-lambda';

type TaskResultBody = {
  functionName: string;
  taskId: string;
  status: string;
  message?: string;
  response?: string;
  startedAt?: string;
  finishedAt?: string;
};

const reporter = async (event: SQSEvent) => {
  const messages = event.Records;

  console.log(messages);

  const results = await Promise.all(
    messages.map(async (message) => {
      const body = JSON.parse(message.body) as TaskResultBody;

      await functionTaskTable.update(
        {
          ID: body.taskId,
          FunctionName: body.functionName,
        },
        {
          Status: body.status,
          Message: body.message,
          Response: body.response,
          StartedAt: body.startedAt,
          FinishedAt: body.finishedAt,
        }
      );

      return body;
    })
  );

  console.log('Finished reporting', JSON.stringify(results, null, 2));
};

export const main = reporter;
