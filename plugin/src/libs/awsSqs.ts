import { SQSClient } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({});

export { sqs };
