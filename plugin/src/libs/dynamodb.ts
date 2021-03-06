import * as dynamoose from 'dynamoose';

const schema = new dynamoose.Schema({
  ID: {
    type: String,
    hashKey: true,
    required: true,
  },
  FunctionName: {
    type: String,
    rangeKey: true,
  },
  Status: String,
  Message: String,
  Response: String,
  StartedAt: String,
  FinishedAt: String,
  SubmittedAt: String,
});

export const functionTaskTable = dynamoose.model(
  process.env.FUNCTION_TASK_TABLE_NAME,
  schema,
  {
    // CloudFormation already creates our table, we don't need to do it here
    create: false,
  }
);
