const dynamoose = require('dynamoose');

const schema = new dynamoose.Schema({
  ID: {
    type: String,
    hashKey: true,
    required: true
  },
  FunctionName: {
    type: String, 
    rangeKey: true
  },
  Status: String,
  Message: String,
  Response: String,
  StartedAt: String,
  FinishedAt: String,
  SubmittedAt: String
});

module.exports = dynamoose.model(process.env.FUNCTION_TASK_TABLE_NAME, schema);
