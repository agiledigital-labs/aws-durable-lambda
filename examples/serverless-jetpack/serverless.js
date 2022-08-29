const myFunction = require('./src/functions/myFunction');

const serverlessConfiguration = {
  service: 'adl-example-serverless-jetpack',
  frameworkVersion: '3',
  plugins: ['@agiledigital/aws-durable-lambda', 'serverless-jetpack'],
  provider: {
    name: 'aws',
    region: 'ap-southeast-2',
    runtime: 'nodejs14.x',
    stage: '${opt:stage}',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
      apiKeys: ['adl-example-${opt:stage}-serverless-jetpack'],
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
  },
  resources: {
    Resources: {},
  },
  custom: {},
};

module.exports = serverlessConfiguration;
