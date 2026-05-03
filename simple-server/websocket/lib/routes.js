const connectHandler = require('../handlers/connect');
const disconnectHandler = require('../handlers/disconnect');
const defaultHandler = require('../handlers/default');
const authHandler = require('../handlers/auth');
const joinRoomHandler = require('../handlers/joinRoom');
const leaveRoomHandler = require('../handlers/leaveRoom');
const typingStartHandler = require('../handlers/typingStart');
const typingStopHandler = require('../handlers/typingStop');

const actionHandlers = {
  auth: authHandler,
  joinRoom: joinRoomHandler,
  leaveRoom: leaveRoomHandler,
  typingStart: typingStartHandler,
  typingStop: typingStopHandler,
};

const routeHandlers = {
  $connect: connectHandler,
  $disconnect: disconnectHandler,
  $default: defaultHandler,
};

const getActionHandler = (action) => actionHandlers[action] || defaultHandler;
const getRouteHandler = (routeKey) => routeHandlers[routeKey] || defaultHandler;

module.exports = {
  getActionHandler,
  getRouteHandler,
};
