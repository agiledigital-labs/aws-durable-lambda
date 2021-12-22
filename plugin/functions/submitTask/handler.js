const functionTaskTable = require('../../libs/dynamodb');
const sqs = require('../../libs/awsSqs');
const { v4 } = require('uuid');

const submitTask = async (event) => {
  try {
    const functionName = event.pathParameters['functionName'];

    const taskId = v4();

    const apiUrl = event.headers['X-Forwarded-Proto'] + '://' + event.headers['Host'] + '/' + event.requestContext['stage'];

    const submittedAt = new Date().toISOString();

    await sqs.sendMessage({
      QueueUrl: process.env.FUNCTION_TASK_QUEUE_URL,
      MessageBody: JSON.stringify({
        functionName,
        taskId
      })
    }).promise();

    await functionTaskTable.Model.create({
      ID: taskId,
      FunctionName: functionName,
      Status: 'Processing',
      SubmittedAt: submittedAt,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        taskId,
        statusUrl: `${apiUrl}/task/${taskId}`
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (e) {
    console.error(e);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: e.message
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
}

module.exports.submitTask = submitTask;
