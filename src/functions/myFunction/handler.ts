
const dummyLongRunningProcessTimeInMillis = 40 * 1000;

const dummyLongRunningProcess = () => new Promise((resolve) => {
  setTimeout(() => resolve({ message: 'Finished long journey' }), dummyLongRunningProcessTimeInMillis);
})

const myFunction = async (event: unknown) => {
  console.log("Called", event);

  const result = await dummyLongRunningProcess();

  return result;
}

export const main = myFunction;
