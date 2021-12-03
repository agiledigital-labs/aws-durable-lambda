import type { AWS } from '@serverless/typescript';
import submitTask from '@functions/submitTask';
import getTask from '@functions/getTask';

const serverlessConfiguration: AWS = {
  service: 'aws-durable-lambda',
  frameworkVersion: '2',
  plugins: ['serverless-esbuild'],
  provider: {
    name: 'aws',
    region: 'ap-southeast-2',
    runtime: 'nodejs14.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      FUNCTION_TASK_QUEUE_NAME: "FunctionTaskQueue-${opt:stage}",
      FUNCTION_TASK_QUEUE_URL: { Ref: 'FunctionTaskQueue' },
      FUNCTION_TASK_TABLE_NAME: "FunctionTaskTable-${opt:stage}"
    },
    lambdaHashingVersion: '20201221',
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: [
              "dynamodb:BatchGet*",
              "dynamodb:DescribeStream",
              "dynamodb:DescribeTable",
              "dynamodb:Get*",
              "dynamodb:Query",
              "dynamodb:Scan",
              "dynamodb:BatchWrite*",
              "dynamodb:CreateTable",
              "dynamodb:Delete*",
              "dynamodb:Update*",
              "dynamodb:PutItem"
            ],
            Resource: "*"
          },
          {
            Effect: "Allow",
            Action: [
              "sqs:GetQueueUrl",
              "sqs:SendMessage",
              "sqs:ReceiveMessage"
            ],
            Resource: "*"
          }
        ]
      }
    }
  },
  // import the function via paths
  functions: {
    submitTask,
    getTask
  },
  package: { individually: true },
  resources: {
    Resources: {
      FunctionTaskQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: 'FunctionTaskQueue-${opt:stage}',
          RedrivePolicy: {
            deadLetterTargetArn: {
              'Fn::GetAtt': ['FunctionTaskDeadLetterQueue', 'Arn'],
            },
            maxReceiveCount: 5,
          },
        },
      },
      FunctionTaskDeadLetterQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {},
      },
      FunctionTaskTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: "FunctionTaskTable-${opt:stage}",
          AttributeDefinitions: [
            {
              AttributeName: "ID",
              AttributeType: "S"
            },
            {
              AttributeName: "FunctionName",
              AttributeType: "S"
            }
          ],
          KeySchema: [
            {
              AttributeName: "ID",
              KeyType: "HASH"
            },
            {
              AttributeName: "FunctionName",
              KeyType: "RANGE"
            }
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        }
      }
    }
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
