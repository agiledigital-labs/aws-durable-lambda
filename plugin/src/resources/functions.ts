/**
 * Determine the function name based on various parameters.
 *
 * @param service the name of the serverless 'service'
 * @param stage the stage name
 * @param name the name of the function (in kebab case)
 * @returns a function name
 */
const functionName = (service: string, stage: string, name: string) =>
  `${service}-adl-${stage}-${name}`;

/**
 * Generates serverless compatible function definitions for the
 * boilerplate functions provided by AWS Durable Lambda.
 *
 * Note: This should be added into the serverless context, as if
 * they were added by a user in serverless.yml.
 * They are _not_ CloudFormation definitions.
 *
 * @param service the name of the serverless 'service'
 * @param stage the stage name
 * @param functionStagingDirectoryName the directory where the boilerplate functions are stored
 * @returns serverless compatible function definitions
 */
const functions = (
  service: string,
  stage: string,
  functionStagingDirectoryName: string,
  layerName: string,
  pluginModulePath: string
) => {
  const commonConfig = {
    layers: [
      {
        Ref: layerName,
      },
    ],
    // Makes serverless-jetpack work correctly, ignored by everything else
    jetpack: {
      trace: {
        ignores: [pluginModulePath],
      },
    },
  };
  return {
    getTask: {
      name: functionName(service, stage, 'get-task'),
      handler: `${functionStagingDirectoryName}/functions/getTask/handler.main`,
      events: [
        {
          http: {
            method: 'get',
            path: 'task/{taskId}',
          },
        },
      ],
      ...commonConfig,
    },
    orchestrator: {
      name: functionName(service, stage, 'orchestrator'),
      handler: `${functionStagingDirectoryName}/functions/orchestrator/handler.main`,
      timeout: 900,
      events: [
        {
          sqs: { arn: { 'Fn::GetAtt': ['FunctionTaskQueue', 'Arn'] } },
          batchSize: 1,
        },
      ],
      ...commonConfig,
    },
    reporter: {
      name: functionName(service, stage, 'reporter'),
      handler: `${functionStagingDirectoryName}/functions/reporter/handler.main`,
      timeout: 900,
      events: [
        {
          sqs: { arn: { 'Fn::GetAtt': ['FunctionTaskOutputQueue', 'Arn'] } },
          batchSize: 1,
        },
      ],
      ...commonConfig,
    },
    submitTask: {
      name: functionName(service, stage, 'submit-task'),
      handler: `${functionStagingDirectoryName}/functions/submitTask/handler.main`,
      events: [
        {
          http: {
            method: 'post',
            path: 'create-task/{functionName}',
          },
        },
      ],
      ...commonConfig,
    },
  };
};

export default functions;
