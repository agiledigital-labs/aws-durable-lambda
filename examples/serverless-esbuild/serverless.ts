import type { AWS } from '@serverless/typescript';
import myFunction from '@functions/myFunction';

const serverlessConfiguration: AWS = {
  service: 'adl-example-serverless-esbuild',

  frameworkVersion: '3',
  plugins: ['serverless-esbuild', '@agiledigital/aws-durable-lambda'],
  provider: {
    name: 'aws',
    region: 'ap-southeast-2',
    runtime: 'nodejs14.x',
    stage: '${opt:stage}',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
      apiKeys: ['adl-example-${opt:stage}-serverless-esbuild'],
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
  package: { individually: true },
  resources: {
    Resources: {},
  },
  custom: {
    esbuild: {
      external: ['@agiledigital/aws-durable-lambda'],
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
