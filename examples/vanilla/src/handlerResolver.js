// TODO: What is this for?
// TODO: Should we export this from the plugin?
const handlerPath = (context) => {
  return `${context.split(process.cwd())[1].substring(1).replace(/\\/g, '/')}`
};

module.exports = {
  handlerPath
}
