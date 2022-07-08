export const orchestratorIamPolicy = {
  OrchestratorPolicy: {
    Type: 'AWS::IAM::ManagedPolicy',
    Properties: {
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          // Currently the target function ARN is provided by an API call
          // and is not known ahead of time so this statement is permissive.
          // In the future we might allow the consumer of the library to
          // narrow this down.
          {
            Effect: 'Allow',
            Action: ['lambda:InvokeFunction'],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: {
              'Fn::GetAtt': ['FunctionTaskOutputQueue', 'Arn'],
            },
          },
        ],
      },
    },
  },
};

export const getTaskIamPolicy = {
  GetTaskPolicy: {
    Type: 'AWS::IAM::ManagedPolicy',
    Properties: {
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['dynamodb:DescribeTable', 'dynamodb:Query'],
            Resource: { 'Fn::GetAtt': ['FunctionTaskTable', 'Arn'] },
          },
        ],
      },
    },
  },
};

export const reporterIamPolicy = {
  ReporterPolicy: {
    Type: 'AWS::IAM::ManagedPolicy',
    Properties: {
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['dynamodb:DescribeTable', 'dynamodb:UpdateItem'],
            Resource: { 'Fn::GetAtt': ['FunctionTaskTable', 'Arn'] },
          },
        ],
      },
    },
  },
};

export const submitTaskIamPolicy = {
  SubmitTaskPolicy: {
    Type: 'AWS::IAM::ManagedPolicy',
    Properties: {
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['dynamodb:DescribeTable', 'dynamodb:PutItem'],
            Resource: { 'Fn::GetAtt': ['FunctionTaskTable', 'Arn'] },
          },
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: {
              'Fn::GetAtt': ['FunctionTaskQueue', 'Arn'],
            },
          },
        ],
      },
    },
  },
};

const iam = {
  ...orchestratorIamPolicy,
  ...getTaskIamPolicy,
  ...reporterIamPolicy,
  ...submitTaskIamPolicy,
};

export default iam;
