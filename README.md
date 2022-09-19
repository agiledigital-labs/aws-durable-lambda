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

Make sure that you add this plugin _before_ any packager plugin you are using.

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

## How it works

aws-durable-lambda will automatically inject CloudFormation resources and serverless config
to create the required infrastructure.

This includes:

- Two SQS queues, one to queue up tasks and the other to queue up the result of a task
- A DynamoDB table to store the task status/results
- Lambda functions to orchestrate the task execution and handle HTTP API queries
- A lambda layer with shared libraries to support the lambda functions
- IAM policies to allow the lambdas to access required resources

A layer will be uploaded which contains the shared libraries used by all the aws-durable-lambda infrastructure lambdas.
This is hashed so it should only be uploaded once, unless aws-durable-lambda is updated with changes to the shared libraries.
The infrastructure lambdas themselves are tiny and are just stubs that call into the layer.

Therefore aws-durable-lambda should cause a negligible difference in package/deploy times
after the first deploy.

The four infrastructure lambdas are:

| Lambda Name  | Purpose                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------- |
| submitTask   | Creates a new task and adds it to the function task queue                                          |
| getTask      | Gets the status of an existing task                                                                |
| orchestrator | Handles messages in the function task queue by executing them. Pushes results to the output queue. |
| reporter     | Handles messages in the output queue by updating the task status with the result.                  |

## Packager Workarounds

There isn't really a well defined and documented API for serverless plugins (at least that we've found).
Most plugins seem to work by running code at specific times using hooks and then monkey patching the serverless config.

This means that there can be different side effects depending on the order and combinations of different plugins.

Since aws-durable-lambda injects functions, layers and raw CloudFormation code into a serverless project,
the main conflict it has is with the different packaging plugins.

The packaging plugins we support at this time are:

- serverless-esbuild
- serverless-jetpack
- serverless-webpack
- serverless-plugin-typescript

Documented below are the workarounds used to ensure compatibility with them:

### serverless-esbuild

If serverless-esbuild is detected, the plugin will be added to the "exclude" list.
Otherwise esbuild will try to follow the dependency graph and bundle up the shared
libraries which are already provided in the lambda layers.

Before:

```javascript
{
  custom: {
    esbuild: {
      packager: 'yarn',
      bundle: true,
      sourcemap: true,
      target: 'node14',
      platform: 'node',
      exclude: ["foo", "bar"],
    },
  },
}
```

After:

```javascript
{
  custom: {
    esbuild: {
      packager: 'yarn',
      bundle: true,
      sourcemap: true,
      target: 'node14',
      platform: 'node',
      exclude: ["foo", "bar", "@agiledigital/aws-durable-lambda"],
    },
  },
}
```

### serverless-jetpack

serverless-jetpack is the most problematic plugin to maintain compatibility with at the moment.

It seems to be in transition to supporting serverless 3.x properly.
It still works with serverless 3.x but it uses the old include/exclude syntax (rather than patterns)

For example: https://github.com/FormidableLabs/serverless-jetpack/issues/208

If serverless-jetpack is detected, old style serverless 2.x config will be used (at least until they update).

This includes using package include/exclude instead of patterns and also putting the artifact property for layers a level down.

Example correct config:

```javascript
{
  layers: {
    example: {
      package: {
        artifact: "foo.zip"
      }
    }
  },
  package: {
    patterns: ["!foo/**", "bar/**"]
  },
}
```

Example config modified for serverless-jetpack support:

```javascript
{
  layers: {
    example: {
      artifact: "foo.zip"
    }
  },
  package: {
    include: ["bar/**"],
    exclude: ["foo/**"]
  },
}
```

To be clear we will _not_ be supporting Serverless 2.x at all.
We will just be using Serverless 2.x syntax with Serverless 3.x to support serverless-jetpack

Issue #122 https://github.com/agiledigital-labs/aws-durable-lambda/issues/122 tracks the upstream issues until we can remove these workarounds.

### serverless-webpack

If serverless-webpack is detected, _and_ `includeModules` is used,
the plugin will be added to the "forceExclude" list.
Otherwise webpack will try to follow the dependency graph and bundle up the shared
libraries which are already provided in the lambda layers.

Before:

```javascript
{
  custom: {
    webpack: {
      packager: 'yarn',
      includeModules: true,
    },
  },
}
```

After:

```javascript
{
  custom: {
    webpack: {
      packager: 'yarn',
      includeModules: {
        forceExclude: "@agiledigital/aws-durable-lambda"
      },
    },
  },
}
```

You may notice duplicate log messages during packaging with serverless-webpack.
This is not an issue with aws-durable-lambda.
We are tracking this upstream issue in: https://github.com/agiledigital-labs/aws-durable-lambda/issues/121

### serverless-plugin-typescript

The example project currently uses serverless-plugin-typescript version 2.1.1
due to a breaking bug in 2.1.2.

We don't have a workaround at this time, you will need to downgrade your serverless-plugin-typescript
plugin to 2.1.1 also to use aws-durable-lambda.

The upstream issue is tracked in: https://github.com/agiledigital-labs/aws-durable-lambda/issues/120

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
