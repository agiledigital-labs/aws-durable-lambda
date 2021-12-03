
const dummyLongRunningProcessTimeInMillis = 10 * 1000;

const dummyLongRunningProcess = () => new Promise((resolve) => {
  setTimeout(() => resolve('Done'), dummyLongRunningProcessTimeInMillis);
})

const myFunction = async (event: unknown) => {
  console.log("Called", event);

  const result = await dummyLongRunningProcess();

  return result;
}

export const main = myFunction;
