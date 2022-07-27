import { TaskEvent, TaskHandler } from '@agiledigital/aws-durable-lambda';

const dummyLongRunningProcessTimeInMillis = 10 * 1000;

const dummyLongRunningProcess = () =>
  new Promise((resolve) => {
    setTimeout(
      () => resolve({ message: 'Finished long journey' }),
      dummyLongRunningProcessTimeInMillis
    );
  });

/**
 * Called by aws-durable-lambda when a new task is submitted.
 *
 * @type TaskHandler
 * @param {TaskEvent} event the event object provided by aws-durable-lambda
 * @returns result the result to store against the task record when it completes
 */
const myFunction = async (event) => {
  console.log('Received event', event);

  const result = await dummyLongRunningProcess();

  return result;
};

module.exports = {
  main: myFunction,
};
