import sqs from '@libs/awsSqs';
import lambda from '@libs/lambda';
import { SQSEvent } from 'aws-lambda';

type TaskMessageBody = {
  functionName: string;
  taskId: string;
}

const orchestrator = async (event: SQSEvent) => {
  const messages = event.Records;

  console.log(messages);

  const results = await Promise.all(messages.map(async (message) => {
    try {
      const body = JSON.parse(message.body) as TaskMessageBody;

      const response = await lambda.invoke({
        FunctionName: body.functionName,
      }).promise();
  
      return { ...body, response: JSON.stringify(response) };
    } catch (e) {
      return { error: true, message: e.message };
    }
  }));

  console.log('Finished processing', JSON.stringify(results, null, 2));

  await Promise.all(results.map(async (result) => {
    return sqs.sendMessage({
      QueueUrl: process.env.FUNCTION_TASK_OUTPUT_QUEUE_URL,
      MessageBody: JSON.stringify({
        ...result,
        status: result.error ? 'Failed' : 'Completed'
      })
    }).promise();
  }));

  console.log('Outputs sent to the queue');
}

export const main = orchestrator;
