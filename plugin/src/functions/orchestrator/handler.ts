import { sqs } from '@libs/awsSqs';
import { lambda } from '@libs/lambda';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { InvokeCommand } from '@aws-sdk/client-lambda';
import { TaskEvent, TaskMessageBody } from '@libs/types';
import { SQSEvent } from 'aws-lambda';

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

        const command = new InvokeCommand({
          FunctionName: functionName,
          Payload: Buffer.from(JSON.stringify(event)),
        });
        const response = await lambda.send(command);

        const finishedAt = new Date().toISOString();

        return {
          ...body,
          response: response.Payload ?? {},
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
    results.map(async (result) => {
      const command = new SendMessageCommand({
        QueueUrl: process.env.FUNCTION_TASK_OUTPUT_QUEUE_URL,
        MessageBody: JSON.stringify({
          ...result,
          status: result.error ? 'Failed' : 'Completed',
        }),
      });
      return sqs.send(command);
    })
  );

  console.log('Outputs sent to the queue');
};

export const main = orchestrator;
