# AWS Durable Lambda

This is sample project that demonstrates that we can use AWS SQS, AWS DynamoDB to achieve a "durable function" run.

So we can bypass the maximum AWS API Gateway/Lambda Proxy timeout.

The idea is you can use the HTTP to submit a request that will trigger a long-running Lambda, and immediately return
a response with a HTTP GET URL to query the status of the task.

`plugin` is a local Serverless Framework plugin that can be extracted to a separate library in the future when it is cleaned up and feature finished.

Usage is demonstrated in teh `serverless.ts`:
```
  plugins: [
    './plugin/aws-durable-lambda'
  ]
```

APIs for the task HTTP submission:
```
POST https://{api gateway endpoint}/create-task/{full name of the function to invoke}
```
The above POST will return a HTTP URL for you to query the task status.
