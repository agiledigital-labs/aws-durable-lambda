const functionTaskTable = require('../../libs/dynamodb');

const getTask = async (event) => {
  try {
    const taskId = event.pathParameters['taskId'];

    console.log(taskId, event.pathParameters);

    const result = await functionTaskTable.query({
      ID: taskId
    }).exec();

    return {
      statusCode: 200,
      body: JSON.stringify(result),
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

module.exports.getTask = getTask;
