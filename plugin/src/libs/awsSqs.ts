import { SQSClient } from '@aws-sdk/client-sqs';
import { SendMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({});

const sendSqsMessage = async (queueUrl: string, body: unknown) => {
  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(body),
  });
  await sqs.send(command);
};

export { sqs, sendSqsMessage };
