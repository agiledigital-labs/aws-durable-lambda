const functionTaskTable = require('../../libs/dynamodb');

const reporter = async (event) => {
  const messages = event.Records;

  console.log(messages);

  const results = await Promise.all(messages.map(async (message) => {
    const body = JSON.parse(message.body);

    await functionTaskTable.update({
      ID: body.taskId,
      FunctionName: body.functionName
    }, {
      Status: body.status,
      Message: body.message,
      Response: body.response,
      StartedAt: body.startedAt,
      FinishedAt: body.finishedAt,
    });

    return body;
  }));

  console.log('Finished reporting', JSON.stringify(results, null, 2));
}

module.exports.reporter = reporter;
