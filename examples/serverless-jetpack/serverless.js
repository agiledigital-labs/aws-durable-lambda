const myFunction = require('./src/functions/myFunction');

const serverlessConfiguration = {
  service: 'adl-example-serverless-jetpack',
  frameworkVersion: '3',
  plugins: [
    'serverless-jetpack',
    '@agiledigital/aws-durable-lambda'
  ],
  provider: {
    name: 'aws',
    region: 'ap-southeast-2',
    runtime: 'nodejs14.x',
    stage: '${opt:stage}',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
      apiKeys: [
        "adl-example-serverless-jetpack"
      ]
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    },
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
          // TODO: Should these be injected automatically by the plugin? (with a more restrictive scope?)
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
          // TODO: Should these be injected automatically by the plugin? (with a more restrictive scope?)
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
  package: { individually: true, exclude: ["**/node_modules/aws-sdk/**"] },
  resources: {
    Resources: {}
  },
  custom: {
  },
};

module.exports = serverlessConfiguration;