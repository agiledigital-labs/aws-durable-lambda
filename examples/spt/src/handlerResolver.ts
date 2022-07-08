// TODO: What is this for?
// TODO: Should we export this from the plugin?
export const handlerPath = (context: string) => {
  return `${context.split(process.cwd())[1].substring(1).replace(/\\/g, '/')}`
};
