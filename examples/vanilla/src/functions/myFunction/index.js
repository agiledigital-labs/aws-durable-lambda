const { handlerPath } = require('../../handlerResolver');

const handler = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  timeout: 900,
  events: []
}


module.exports = handler;