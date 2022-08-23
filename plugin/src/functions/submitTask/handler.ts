import { functionTaskTable } from '@libs/dynamodb';
import { APIGatewayEvent } from 'aws-lambda';
import { sqs } from '../../libs/awsSqs';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { v4 } from 'uuid';
import { TaskMessageBody } from '@libs/types';

/**
 * Takes the body attribute that is passed in by the API Gateway proxy event
 * and makes sure that it is either parsed to an object, or if it is falsy
 * (e.g. null/undefined/empty string) it will return undefined.
 *
 * The AWS types say that it should always be a string, but it seems like
 * it can also come through as null. If it doesn't match the type contract
 * we should probably be extra cautious and check for all kinds of falsy value.
 *
 * @param body the body attribute passed in by an API Gateway proxy event
 * @returns either the parsed object or undefined
 */
const tryExtractBody = (body: string): unknown | undefined => {
  const coercedBody = body ?? '';
  if (coercedBody.trim().length > 0) {
    return JSON.parse(body);
  }
  return undefined;
};

const submitTask = async (event: APIGatewayEvent) => {
  try {
    const functionName = event.pathParameters['functionName'];

    const taskId = v4();

    const apiUrl =
      event.headers['X-Forwarded-Proto'] +
      '://' +
      event.headers['Host'] +
      '/' +
      event.requestContext['stage'];

    const submittedAt = new Date().toISOString();
    const requestPayload = tryExtractBody(event.body);

    const body: TaskMessageBody = {
      functionName,
      taskId,
      requestPayload,
    };

    const command = new SendMessageCommand({
      QueueUrl: process.env.FUNCTION_TASK_QUEUE_URL,
      MessageBody: JSON.stringify(body),
    });
    await sqs.send(command);

    await functionTaskTable.Model.create({
      ID: taskId,
      FunctionName: functionName,
      Status: 'Processing',
      SubmittedAt: submittedAt,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        taskId,
        statusUrl: `${apiUrl}/task/${taskId}`,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (e) {
    console.error(e);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: e.message,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
};

export const main = submitTask;
