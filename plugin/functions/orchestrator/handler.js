 const sqs = require('../../libs/awsSqs');
 const lambda = require('../../libs/lambda');

const orchestrator = async (event) => {
  const messages = event.Records;

  const results = await Promise.all(messages.map(async (message) => {
    const startedAt = new Date().toISOString();

    try {
      const body = JSON.parse(message.body);

      const response = await lambda.invoke({
        FunctionName: body.functionName,
      }).promise();

      const finishedAt = new Date().toISOString();
  
      return { ...body, response: JSON.stringify(response), startedAt, finishedAt };
    } catch (e) {
      return { error: true, message: e.message, startedAt };
    }
  }));

  console.log('Finished processing', JSON.stringify(results, null, 2));

  await Promise.all(results.map(async (result) => {
    return sqs.sendMessage({
      QueueUrl: process.env.FUNCTION_TASK_OUTPUT_QUEUE_URL,
      MessageBody: JSON.stringify({
        ...result,
        status: result.error ? 'Failed' : 'Completed'
      })
    }).promise();
  }));

  console.log('Outputs sent to the queue');
}

module.exports.orchestrator = orchestrator;
