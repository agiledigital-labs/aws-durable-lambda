/**
 * Type imports for jsdoc which provide intellisense assistance in VSCode
 * even without TypeScript
 * See https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html#import-types
 * @typedef { import('@agiledigital/aws-durable-lambda').TaskEvent } TaskEvent
 * @typedef { import('@agiledigital/aws-durable-lambda').TaskHandler } TaskHandler
 */

const dummyLongRunningProcessTimeInMillis = 10 * 1000;

const dummyLongRunningProcess = (input) =>
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
 * @type TaskHandler
 * @param {TaskEvent<{ input: string }>} event the event object provided by aws-durable-lambda
 * @returns result the result to store against the task record when it completes
 */
const myFunction = async (event) => {
  console.log('Received event', event);

  const result = await dummyLongRunningProcess(event.requestPayload.input);

  return result;
};

module.exports = {
  main: myFunction,
};
