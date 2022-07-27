import type { TaskEvent, TaskHandler } from '@agiledigital/aws-durable-lambda';

/**
 * Payload that is specific to this task and is passed
 * in when createTask is called.
 */
type TaskPayload = { input: string };

const dummyLongRunningProcessTimeInMillis = 10 * 1000;

const dummyLongRunningProcess = (input: string) =>
  new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          message: 'Finished long journey',
          transformedInput: input.toLocaleUpperCase(),
        }),
      dummyLongRunningProcessTimeInMillis
    );
  });

/**
 * Called by aws-durable-lambda when a new task is submitted.
 *
 * @param event the event object provided by aws-durable-lambda
 * @returns result the result to store against the task record when it completes
 */
const myFunction: TaskHandler = async (event: TaskEvent<TaskPayload>) => {
  console.log('Received event', event);

  const result = await dummyLongRunningProcess(event.requestPayload.input);

  return result;
};

export const main = myFunction;
