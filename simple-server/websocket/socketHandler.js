const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

class SocketHandler {
  constructor() {
    this.connections = new Map(); // userId -> socket connection
    this.rooms = new Map();      // roomId -> Set of userIds
    this.typingUsers = new Map(); // roomId -> Map of userId -> timeout
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  // Handle new WebSocket connection
  async handleConnection(io, socket) {
    try {
      // Authenticate user from JWT token
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await this.getUserById(decoded.userId);

      if (!user) {
        socket.disconnect();
        return;
      }

      // Store connection
      this.connections.set(user.id, socket);
      socket.userId = user.id;
      socket.user = user;

      console.log(`User ${user.username} connected`);

      // Join user to their rooms (servers, DMs)
      await this.joinUserRooms(socket, user.id);

      // Broadcast presence update
      this.broadcastPresenceUpdate(user.id, 'online');

      // Handle events
      this.setupEventHandlers(io, socket);

    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      socket.disconnect();
    }
  }

  // Setup event handlers
  setupEventHandlers(io, socket) {
    // Join/leave rooms
    socket.on('join_room', (roomId) => this.joinRoom(socket, roomId));
    socket.on('leave_room', (roomId) => this.leaveRoom(socket, roomId));

    // Typing events
    socket.on('start_typing', (data) => this.handleStartTyping(io, socket, data));
    socket.on('stop_typing', (data) => this.handleStopTyping(io, socket, data));

    // Message reactions
    socket.on('add_reaction', (data) => this.handleAddReaction(io, socket, data));
    socket.on('remove_reaction', (data) => this.handleRemoveReaction(io, socket, data));

    // Handle disconnection
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  // Join user to their relevant rooms
  async joinUserRooms(socket, userId) {
    try {
      // Get user's servers and join their channels
      const serverQuery = `
        SELECT s.id as server_id, c.id as channel_id 
        FROM servers s
        JOIN server_members sm ON s.id = sm.server_id
        LEFT JOIN channels c ON s.id = c.server_id
        WHERE sm.user_id = $1
      `;
      const serverResult = await this.pool.query(serverQuery, [userId]);

      serverResult.rows.forEach(row => {
        if (row.channel_id) {
          socket.join(`channel:${row.channel_id}`);
          this.addToRoom(`channel:${row.channel_id}`, userId);
        }
        socket.join(`server:${row.server_id}`);
        this.addToRoom(`server:${row.server_id}`, userId);
      });

      // Get user's DMs
      const dmQuery = `
        SELECT id FROM direct_messages 
        WHERE user1_id = $1 OR user2_id = $1
      `;
      const dmResult = await this.pool.query(dmQuery, [userId]);

      dmResult.rows.forEach(row => {
        socket.join(`dm:${row.id}`);
        this.addToRoom(`dm:${row.id}`, userId);
      });

    } catch (error) {
      console.error('Error joining user rooms:', error);
    }
  }

  // Message Events - called from API routes
  broadcastMessageCreate(roomId, message) {
    const roomType = roomId.startsWith('dm:') ? 'dm' : 'channel';
    this.io.to(roomId).emit('message_create', {
      type: 'MESSAGE_CREATE',
      data: {
        roomType,
        roomId,
        message
      }
    });
  }

  broadcastMessageUpdate(roomId, message) {
    const roomType = roomId.startsWith('dm:') ? 'dm' : 'channel';
    this.io.to(roomId).emit('message_update', {
      type: 'MESSAGE_UPDATE',
      data: {
        roomType,
        roomId,
        message
      }
    });
  }

  broadcastMessageDelete(roomId, messageId) {
    const roomType = roomId.startsWith('dm:') ? 'dm' : 'channel';
    this.io.to(roomId).emit('message_delete', {
      type: 'MESSAGE_DELETE',
      data: {
        roomType,
        roomId,
        messageId
      }
    });
  }

  // Typing Events
  handleStartTyping(io, socket, { roomId }) {
    // Clear existing typing timeout for this user
    this.clearTypingTimeout(roomId, socket.userId);

    // Broadcast typing event
    socket.to(roomId).emit('user_typing', {
      type: 'USER_TYPING',
      data: {
        roomId,
        user: {
          id: socket.user.id,
          username: socket.user.username,
          displayName: socket.user.display_name
        }
      }
    });

    // Auto-stop typing after 5 seconds
    const timeout = setTimeout(() => {
      this.handleStopTyping(io, socket, { roomId });
    }, 5000);

    this.setTypingTimeout(roomId, socket.userId, timeout);
  }

  handleStopTyping(io, socket, { roomId }) {
    this.clearTypingTimeout(roomId, socket.userId);
    
    socket.to(roomId).emit('user_stop_typing', {
      type: 'USER_STOP_TYPING',
      data: {
        roomId,
        userId: socket.userId
      }
    });
  }

  // Reaction Events
  async handleAddReaction(io, socket, { messageId, emoji }) {
    try {
      // Add reaction to database
      await this.pool.query(
        `INSERT INTO message_reactions (message_id, user_id, emoji) 
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [messageId, socket.userId, emoji]
      );

      // Get message details
      const messageQuery = `
        SELECT m.*, 
               CASE 
                 WHEN m.channel_id IS NOT NULL THEN 'channel'
                 ELSE 'dm'
               END as room_type,
               COALESCE(m.channel_id, m.dm_id) as room_id
        FROM messages m
        WHERE m.id = $1
      `;
      const messageResult = await this.pool.query(messageQuery, [messageId]);

      if (messageResult.rows.length > 0) {
        const message = messageResult.rows[0];
        const roomId = `${message.room_type}:${message.room_id}`;

        // Broadcast reaction addition
        this.io.to(roomId).emit('message_reaction_add', {
          type: 'MESSAGE_REACTION_ADD',
          data: {
            messageId,
            emoji,
            userId: socket.userId,
            user: {
              id: socket.user.id,
              username: socket.user.username,
              displayName: socket.user.display_name
            }
          }
        });
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }

  async handleRemoveReaction(io, socket, { messageId, emoji }) {
    try {
      // Remove reaction from database
      await this.pool.query(
        `DELETE FROM message_reactions 
         WHERE message_id = $1 AND user_id = $2 AND emoji = $3`,
        [messageId, socket.userId, emoji]
      );

      // Get message details
      const messageQuery = `
        SELECT m.*, 
               CASE 
                 WHEN m.channel_id IS NOT NULL THEN 'channel'
                 ELSE 'dm'
               END as room_type,
               COALESCE(m.channel_id, m.dm_id) as room_id
        FROM messages m
        WHERE m.id = $1
      `;
      const messageResult = await this.pool.query(messageQuery, [messageId]);

      if (messageResult.rows.length > 0) {
        const message = messageResult.rows[0];
        const roomId = `${message.room_type}:${message.room_id}`;

        // Broadcast reaction removal
        this.io.to(roomId).emit('message_reaction_remove', {
          type: 'MESSAGE_REACTION_REMOVE',
          data: {
            messageId,
            emoji,
            userId: socket.userId
          }
        });
      }
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  }

  // Presence Events
  async handleDisconnect(socket) {
    const userId = socket.userId;
    const user = socket.user;

    if (userId) {
      // Remove connection
      this.connections.delete(userId);
      
      // Remove from all rooms
      this.rooms.forEach((users, roomId) => {
        users.delete(userId);
        if (users.size === 0) {
          this.rooms.delete(roomId);
        }
      });

      // Clear typing timeouts
      this.typingUsers.forEach((userMap, roomId) => {
        if (userMap.has(userId)) {
          clearTimeout(userMap.get(userId));
          userMap.delete(userId);
        }
      });

      // Broadcast presence update
      this.broadcastPresenceUpdate(userId, 'offline');

      // Update database
      await this.updateUserPresence(userId, 'offline');

      console.log(`User ${user.username} disconnected`);
    }
  }

  broadcastPresenceUpdate(userId, status) {
    // Broadcast to all servers and DMs this user is part of
    this.connections.forEach((socket, connectedUserId) => {
      if (connectedUserId !== userId) {
        socket.emit('presence_update', {
          type: 'PRESENCE_UPDATE',
          data: {
            userId,
            status,
            timestamp: new Date().toISOString()
          }
        });
      }
    });
  }

  // Channel Events
  broadcastChannelCreate(serverId, channel) {
    this.io.to(`server:${serverId}`).emit('channel_create', {
      type: 'CHANNEL_CREATE',
      data: {
        serverId,
        channel
      }
    });
  }

  broadcastChannelDelete(serverId, channelId) {
    this.io.to(`server:${serverId}`).emit('channel_delete', {
      type: 'CHANNEL_DELETE',
      data: {
        serverId,
        channelId
      }
    });
  }

  // Helper methods
  joinRoom(socket, roomId) {
    socket.join(roomId);
    this.addToRoom(roomId, socket.userId);
  }

  leaveRoom(socket, roomId) {
    socket.leave(roomId);
    this.removeFromRoom(roomId, socket.userId);
  }

  addToRoom(roomId, userId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(userId);
  }

  removeFromRoom(roomId, userId) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(userId);
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  setTypingTimeout(roomId, userId, timeout) {
    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Map());
    }
    this.typingUsers.get(roomId).set(userId, timeout);
  }

  clearTypingTimeout(roomId, userId) {
    if (this.typingUsers.has(roomId) && this.typingUsers.get(roomId).has(userId)) {
      clearTimeout(this.typingUsers.get(roomId).get(userId));
      this.typingUsers.get(roomId).delete(userId);
    }
  }

  async getUserById(userId) {
    try {
      const result = await this.pool.query(
        'SELECT id, username, email, display_name, avatar, status FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async updateUserPresence(userId, status) {
    try {
      await this.pool.query(
        'UPDATE users SET status = $1, last_seen = NOW() WHERE id = $2',
        [status, userId]
      );
    } catch (error) {
      console.error('Error updating user presence:', error);
    }
  }

  // Get online users in a room
  getOnlineUsersInRoom(roomId) {
    const usersInRoom = this.rooms.get(roomId) || new Set();
    return Array.from(usersInRoom).map(userId => {
      const socket = this.connections.get(userId);
      return socket ? socket.user : null;
    }).filter(Boolean);
  }
}

module.exports = SocketHandler;
