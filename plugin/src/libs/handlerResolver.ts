/**
 * Makes an absolute path to a handler, into a relative one,
 * in a cross platform way.
 *
 * @param context The path to the handler directory (use __dirname)
 * @returns
 */
export const handlerPath = (context: string) => {
  return `${context.split(process.cwd())[1].substring(1).replace(/\\/g, '/')}`;
};
