# AWS Durable Lambda

[![Serverless][ico-serverless]][link-serverless]
[![Build Status][ico-build]][link-build]

Warning: This plugin is currently in a pre-release state and is being actively worked on. We hope to release a v1 in the coming weeks, but until then there may be bugs and breaking API changes.

This is a serverless plugin that automates using AWS SQS and AWS DynamoDB make a function "durable".

This pattern is generally used to bypass the maximum AWS API Gateway/Lambda Proxy timeout.

The idea is you can use the HTTP to submit a request that will trigger a long-running Lambda. This call will immediately return a response with a HTTP GET URL that allows you to query the status of the task.

Usage is demonstrated in the example projects in the [examples folder](./examples).

Usually it would be as simple as adding the following line to your serverless definition file:

```typescript
// serverless.ts
plugins: ["@agiledigital/aws-durable-lambda"];
```

```yaml
# serverless.yaml
plugins:
  - "@agiledigital/aws-durable-lambda"
```

Then you can call your lambda using the automatically generated "create-task" endpoint.

```
POST https://{api gateway endpoint}/create-task/{full name of the function to invoke} -d '{ optional: "payload" }'
```

The above POST will return a HTTP URL for you to query the task status.

Calling that will give you a payload like the following:

```json
{
  "SubmittedAt": "2022-07-27T11:14:37.251Z",
  "FunctionName": "adl-example-serverless-esbuild-sandbox-myFunction",
  "Status": "Processing",
  "ID": "6f7ca34a-8de6-434f-9337-763d2a075566"
}
```

Eventually when you task is complete, the task status query will return something like the following.

```json
{
  "SubmittedAt": "2022-07-27T11:14:37.251Z",
  "FunctionName": "adl-example-serverless-esbuild-sandbox-myFunction",
  "FinishedAt": "2022-07-27T11:14:48.343Z",
  "Response": "{\"message\":\"Finished long journey\",\"transformedInput\":\"HELLO WORLD!\"}",
  "StartedAt": "2022-07-27T11:14:37.949Z",
  "Status": "Completed",
  "ID": "6f7ca34a-8de6-434f-9337-763d2a075566"
}
```

## Testing

As we need to inject the required infrastructure into an existing serverless project,
the main source of issues will be the interaction with the different bundler/packager
configurations.

We have an example project for each of the four most popular bundlers,
and also a project that uses the vanilla serverless packaging
under the examples folder.

There is currently an automatic CI job that packages each example to ensure that
that there are no packaging errors. However the automatic CI job does not deploy
the example to AWS or do any integration testing.

To test it more thoroughly, you can deploy each example individually,
or you can use the "examples/deploy-all.sh" to automatically build the plugin,
and deploy all the examples.

```bash
# Manual deploy example

cd examples/serverless-esbuild
yarn install
yarn sls deploy --stage sandbox --verbose
```

Once you have all the examples deployed, you can run a smoke test
automatically using the "examples/validate-all.sh"

```bash
# Manually test an a deployed API (you could also get most of these values via the AWS console)

REGION="ap-southeast-2"
STAGE="sandbox"
EXAMPLE_NAME="serverless-esbuild"
API_NAME="adl-example-$EXAMPLE_NAME-sandbox"
API_NAME_QUERY="items[?name==\`${API_NAME}\`].[id]"
API_ID=`aws apigateway get-rest-apis --query "${API_NAME_QUERY}" --output text`
API_KEY=`aws apigateway get-api-keys --name-query adl-example-serverless-esbuild --include-values --query "items[0].[value]" --output text`
API_BASE_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"
STATUS_URL=`curl -s -X POST -H 'API_KEY: ${API_KEY}' "${API_BASE_URL}/create-task/${API_NAME}-myFunction" | jq -r ".statusUrl"`
curl -s -H 'API_KEY: ${API_KEY}' "${STATUS_URL}" | jq -r ".[0].Status"`
```

This is currently a manual process, however we hope to automate this in the future.

[ico-build]: https://github.com/agiledigital-labs/aws-durable-lambda/actions/workflows/package.yml/badge.svg
[ico-serverless]: http://public.serverless.com/badges/v3.svg
[link-build]: https://github.com/agiledigital-labs/aws-durable-lambda/actions/workflows/package.yml
[link-serverless]: https://www.serverless.com/
