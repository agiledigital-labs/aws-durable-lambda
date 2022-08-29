import type { AWS } from '@serverless/typescript';
import myFunction from '@functions/myFunction';

// serverless-plugin-typescript was abbreviated to SPT to avoid issues with max resource name length
const serverlessConfiguration: AWS = {
  service: 'adl-example-spt',
  frameworkVersion: '3',
  plugins: ['serverless-plugin-typescript', '@agiledigital/aws-durable-lambda'],
  provider: {
    name: 'aws',
    region: 'ap-southeast-2',
    runtime: 'nodejs14.x',
    stage: '${opt:stage}',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
      apiKeys: ['adl-example-${opt:stage}-spt'],
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    },
  },
  // import the function via paths
  functions: {
    myFunction,
  },
  package: {
    individually: true,
    patterns: [
      // Not sure why I have to add this as all the dependencies are
      // dev dependencies and _should_ be automatically excluded
      // You will probably have your own packaging config for your
      // own project and will not have to include this
      '!node_modules/**',
    ],
  },
  resources: {
    Resources: {},
  },
};

module.exports = serverlessConfiguration;
