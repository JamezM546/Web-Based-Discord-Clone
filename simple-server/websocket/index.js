const { Server } = require('socket.io');
const SocketHandler = require('./socketHandler');

class WebSocketServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || ["http://localhost:5173"],
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    this.socketHandler = new SocketHandler();
    this.socketHandler.io = this.io;
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.socketHandler.handleConnection(this.io, socket);
    });

    console.log('WebSocket server initialized');
  }

  // Expose methods for API routes to call
  broadcastMessageCreate(roomId, message) {
    this.socketHandler.broadcastMessageCreate(roomId, message);
  }

  broadcastMessageUpdate(roomId, message) {
    this.socketHandler.broadcastMessageUpdate(roomId, message);
  }

  broadcastMessageDelete(roomId, messageId) {
    this.socketHandler.broadcastMessageDelete(roomId, messageId);
  }

  broadcastChannelCreate(serverId, channel) {
    this.socketHandler.broadcastChannelCreate(serverId, channel);
  }

  broadcastChannelDelete(serverId, channelId) {
    this.socketHandler.broadcastChannelDelete(serverId, channelId);
  }

  getOnlineUsersInRoom(roomId) {
    return this.socketHandler.getOnlineUsersInRoom(roomId);
  }
}

module.exports = WebSocketServer;
