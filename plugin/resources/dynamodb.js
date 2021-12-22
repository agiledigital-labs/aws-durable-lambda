const dynamodb = (stage) => ({
  FunctionTaskTable: {
    Type: 'AWS::DynamoDB::Table',
    Properties: {
      TableName: `FunctionTaskTable-${stage}`,
      AttributeDefinitions: [
        {
          AttributeName: 'ID',
          AttributeType: 'S'
        },
        {
          AttributeName: 'FunctionName',
          AttributeType: 'S'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'ID',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'FunctionName',
          KeyType: 'RANGE'
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      }
    }
  }
});

module.exports = dynamodb;
