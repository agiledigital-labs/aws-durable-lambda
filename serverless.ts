import type { AWS } from '@serverless/typescript';
import myFunction from '@functions/myFunction';

const serverlessConfiguration: AWS = {
  service: 'aws-durable-lambda',
  frameworkVersion: '2',
  plugins: [
    'serverless-esbuild',
    './plugin/aws-durable-lambda'
  ],
  provider: {
    name: 'aws',
    region: 'ap-southeast-2',
    runtime: 'nodejs14.x',
    stage: '${opt:stage}',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    },
    lambdaHashingVersion: '20201221',
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: [
              'lambda:InvokeFunction'
            ],
            Resource: '*'
          },
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:BatchGet*',
              'dynamodb:DescribeStream',
              'dynamodb:DescribeTable',
              'dynamodb:Get*',
              'dynamodb:Query',
              'dynamodb:Scan',
              'dynamodb:BatchWrite*',
              'dynamodb:CreateTable',
              'dynamodb:Delete*',
              'dynamodb:Update*',
              'dynamodb:PutItem'
            ],
            Resource: '*'
          },
          {
            Effect: 'Allow',
            Action: [
              'sqs:GetQueueUrl',
              'sqs:SendMessage',
              'sqs:ReceiveMessage'
            ],
            Resource: '*'
          }
        ]
      }
    }
  },
  // import the function via paths
  functions: {
    myFunction,
  },
  package: { individually: true },
  resources: {
    Resources: {}
  },
  custom: {
    esbuild: {
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
