import type { SQSEvent } from 'aws-lambda';
import type {
  TaskEvent,
  TaskMessageBody,
} from '@agiledigital/aws-durable-lambda';

import {
  sendSqsMessage,
  invokeLambdaFunction,
} from '@agiledigital/aws-durable-lambda';
import { TextDecoder } from 'util';

const orchestrator = async (event: SQSEvent) => {
  const messages = event.Records;

  const results = await Promise.all(
    messages.map(async (message) => {
      const startedAt = new Date().toISOString();

      try {
        const body = JSON.parse(message.body) as TaskMessageBody;
        const { functionName, taskId, requestPayload } = body;
        const event: TaskEvent = {
          taskId,
          requestPayload,
        };

        const response = await invokeLambdaFunction(functionName, event);

        const finishedAt = new Date().toISOString();

        const decoder = new TextDecoder('utf-8');

        const payload =
          response.Payload === undefined
            ? {}
            : decoder.decode(response.Payload);

        return {
          ...body,
          response: payload,
          startedAt,
          finishedAt,
        };
      } catch (e) {
        return { error: true, message: e.message, startedAt };
      }
    })
  );

  console.log('Finished processing', JSON.stringify(results, null, 2));

  await Promise.all(
    results.map(async (result) =>
      sendSqsMessage(process.env.FUNCTION_TASK_OUTPUT_QUEUE_URL, {
        ...result,
        status: result.error ? 'Failed' : 'Completed',
      })
    )
  );

  console.log('Outputs sent to the queue');
};

export const main = orchestrator;
