import { handlerPath } from '../../handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  timeout: 900,
  events: []
}
