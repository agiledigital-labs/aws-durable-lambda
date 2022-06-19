
const dummyLongRunningProcessTimeInMillis = 10 * 1000;

const dummyLongRunningProcess = () => new Promise((resolve) => {
  setTimeout(() => resolve({ message: 'Finished long journey' }), dummyLongRunningProcessTimeInMillis);
})

const myFunction = async (event: unknown) => {
  console.log("Received event", event);

  const result = await dummyLongRunningProcess();

  return result;
}

export const main = myFunction;