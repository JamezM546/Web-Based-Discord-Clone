const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { 
  ApiGatewayManagementApiClient,
  PostToConnectionCommand 
} = require('@aws-sdk/client-apigatewaymanagementapi');

class WebSocketHandler {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    // Initialize API Gateway Management client
    this.apiGateway = new ApiGatewayManagementApiClient({
      region: process.env.AWS_REGION || 'us-east-1',
      apiVersion: '2018-11-29'
    });
  }

  // Handle WebSocket connection establishment
  async handleConnect(event) {
    try {
      console.log('WebSocket connect event:', event);

      // Extract JWT from query string or headers
      const token = this.extractTokenFromEvent(event);
      if (!token) {
        console.error('No token provided in WebSocket connect');
        return { statusCode: 401, body: 'Unauthorized' };
      }

      // Verify JWT and extract user
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await this.getUserById(decoded.userId);
      
      if (!user) {
        console.error('Invalid user in WebSocket connect');
        return { statusCode: 401, body: 'Invalid user' };
      }

      // Store connection in database
      await this.storeConnection(
        event.requestContext.connectionId,
        user.id
      );

      console.log(`User ${user.username} connected via WebSocket`);

      // Broadcast presence update to other users
      await this.broadcastPresenceUpdate(user.id, 'online', event.requestContext.connectionId);

      return { statusCode: 200, body: 'Connected' };

    } catch (error) {
      console.error('WebSocket connect error:', error);
      return { statusCode: 500, body: 'Connection failed' };
    }
  }

  // Handle WebSocket connection termination
  async handleDisconnect(event) {
    try {
      console.log('WebSocket disconnect event:', event);

      // Get user ID from connection before removing
      const connection = await this.getConnection(event.requestContext.connectionId);
      
      if (connection) {
        // Remove connection from database
        await this.removeConnection(event.requestContext.connectionId);

        // Broadcast presence update
        await this.broadcastPresenceUpdate(connection.user_id, 'offline', event.requestContext.connectionId);

        console.log(`User ${connection.user_id} disconnected via WebSocket`);
      }

      return { statusCode: 200, body: 'Disconnected' };

    } catch (error) {
      console.error('WebSocket disconnect error:', error);
      return { statusCode: 500, body: 'Disconnect failed' };
    }
  }

  // Handle incoming WebSocket messages (default route)
  async handleRouteMessage(event) {
    try {
      console.log('WebSocket route message event:', event);

      // Parse incoming message
      const message = JSON.parse(event.body);
      const { type, payload } = message;

      // Get connection info
      const connection = await this.getConnection(event.requestContext.connectionId);
      if (!connection) {
        console.error('Connection not found for message routing');
        return { statusCode: 401, body: 'Connection not found' };
      }

      // Route message based on type
      switch (type) {
        case 'JOIN_ROOM':
          return this.handleJoinRoom(connection, payload);
        
        case 'LEAVE_ROOM':
          return this.handleLeaveRoom(connection, payload);
        
        case 'MESSAGE_CREATE':
          return this.handleMessageCreate(connection, payload);
        
        case 'MESSAGE_UPDATE':
          return this.handleMessageUpdate(connection, payload);
        
        case 'MESSAGE_DELETE':
          return this.handleMessageDelete(connection, payload);
        
        case 'USER_TYPING':
          return this.handleUserTyping(connection, payload);
        
        case 'USER_STOP_TYPING':
          return this.handleUserStopTyping(connection, payload);
        
        case 'MESSAGE_REACTION_ADD':
          return this.handleReactionAdd(connection, payload);
        
        case 'MESSAGE_REACTION_REMOVE':
          return this.handleReactionRemove(connection, payload);
        
        default:
          console.warn('Unknown message type:', type);
          return { statusCode: 400, body: 'Unknown message type' };
      }

    } catch (error) {
      console.error('WebSocket route message error:', error);
      return { statusCode: 500, body: 'Message routing failed' };
    }
  }

  // Handle room joining
  async handleJoinRoom(connection, payload) {
    const { roomId } = payload;
    
    // Store room membership (you might want a separate table for this)
    console.log(`User ${connection.user_id} joined room ${roomId}`);
    
    return { statusCode: 200, body: 'Room joined' };
  }

  // Handle room leaving
  async handleLeaveRoom(connection, payload) {
    const { roomId } = payload;
    
    console.log(`User ${connection.user_id} left room ${roomId}`);
    
    return { statusCode: 200, body: 'Room left' };
  }

  // Handle message creation
  async handleMessageCreate(connection, payload) {
    const { roomType, roomId, message } = payload;
    
    // Broadcast message to all users in the room
    const broadcastPayload = {
      type: 'MESSAGE_CREATE',
      payload: {
        roomType,
        roomId,
        message
      }
    };

    await this.broadcastToRoom(roomId, broadcastPayload, connection.connection_id);
    
    return { statusCode: 200, body: 'Message created' };
  }

  // Handle message update
  async handleMessageUpdate(connection, payload) {
    const { roomType, roomId, message } = payload;
    
    const broadcastPayload = {
      type: 'MESSAGE_UPDATE',
      payload: {
        roomType,
        roomId,
        message
      }
    };

    await this.broadcastToRoom(roomId, broadcastPayload, connection.connection_id);
    
    return { statusCode: 200, body: 'Message updated' };
  }

  // Handle message deletion
  async handleMessageDelete(connection, payload) {
    const { roomType, roomId, messageId } = payload;
    
    const broadcastPayload = {
      type: 'MESSAGE_DELETE',
      payload: {
        roomType,
        roomId,
        messageId
      }
    };

    await this.broadcastToRoom(roomId, broadcastPayload, connection.connection_id);
    
    return { statusCode: 200, body: 'Message deleted' };
  }

  // Handle user typing
  async handleUserTyping(connection, payload) {
    const { roomId } = payload;
    
    // Get user details
    const user = await this.getUserById(connection.user_id);
    
    const broadcastPayload = {
      type: 'USER_TYPING',
      payload: {
        roomId,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name
        }
      }
    };

    await this.broadcastToRoom(roomId, broadcastPayload, connection.connection_id);
    
    return { statusCode: 200, body: 'Typing indicator sent' };
  }

  // Handle user stop typing
  async handleUserStopTyping(connection, payload) {
    const { roomId } = payload;
    
    const broadcastPayload = {
      type: 'USER_STOP_TYPING',
      payload: {
        roomId,
        userId: connection.user_id
      }
    };

    await this.broadcastToRoom(roomId, broadcastPayload, connection.connection_id);
    
    return { statusCode: 200, body: 'Stop typing indicator sent' };
  }

  // Handle reaction addition
  async handleReactionAdd(connection, payload) {
    const { messageId, emoji } = payload;
    
    // Add reaction to database
    await this.pool.query(
      'INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [messageId, connection.user_id, emoji]
    );

    // Get user details
    const user = await this.getUserById(connection.user_id);
    
    // Get message details to determine room
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

      const broadcastPayload = {
        type: 'MESSAGE_REACTION_ADD',
        payload: {
          messageId,
          emoji,
          userId: connection.user_id,
          user: {
            id: user.id,
            username: user.username,
            displayName: user.display_name
          }
        }
      };

      await this.broadcastToRoom(roomId, broadcastPayload, connection.connection_id);
    }
    
    return { statusCode: 200, body: 'Reaction added' };
  }

  // Handle reaction removal
  async handleReactionRemove(connection, payload) {
    const { messageId, emoji } = payload;
    
    // Remove reaction from database
    await this.pool.query(
      'DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
      [messageId, connection.user_id, emoji]
    );

    // Get message details to determine room
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

      const broadcastPayload = {
        type: 'MESSAGE_REACTION_REMOVE',
        payload: {
          messageId,
          emoji,
          userId: connection.user_id
        }
      };

      await this.broadcastToRoom(roomId, broadcastPayload, connection.connection_id);
    }
    
    return { statusCode: 200, body: 'Reaction removed' };
  }

  // Broadcast message to all connections in a room
  async broadcastToRoom(roomId, payload, excludeConnectionId = null) {
    try {
      // Get all connections for users in this room
      // Note: You'll need to implement room membership tracking
      // For now, we'll broadcast to all active connections except the sender
      const connections = await this.getAllConnections(excludeConnectionId);
      
      const message = JSON.stringify(payload);
      
      // Send to each connection
      for (const connection of connections) {
        try {
          const command = new PostToConnectionCommand({
            ConnectionId: connection.connection_id,
            Data: message
          });
          
          await this.apiGateway.send(command);
        } catch (error) {
          console.error(`Failed to send to connection ${connection.connection_id}:`, error);
          
          // Remove dead connections
          if (error.statusCode === 410) { // Gone
            await this.removeConnection(connection.connection_id);
          }
        }
      }
      
    } catch (error) {
      console.error('Broadcast to room error:', error);
    }
  }

  // Broadcast presence update
  async broadcastPresenceUpdate(userId, status, excludeConnectionId = null) {
    try {
      const connections = await this.getAllConnections(excludeConnectionId);
      
      const payload = {
        type: 'PRESENCE_UPDATE',
        payload: {
          userId,
          status,
          timestamp: new Date().toISOString()
        }
      };
      
      const message = JSON.stringify(payload);
      
      for (const connection of connections) {
        try {
          const command = new PostToConnectionCommand({
            ConnectionId: connection.connection_id,
            Data: message
          });
          
          await this.apiGateway.send(command);
        } catch (error) {
          console.error(`Failed to send presence to connection ${connection.connection_id}:`, error);
          
          if (error.statusCode === 410) {
            await this.removeConnection(connection.connection_id);
          }
        }
      }
      
    } catch (error) {
      console.error('Broadcast presence error:', error);
    }
  }

  // Database helper methods
  async storeConnection(connectionId, userId) {
    await this.pool.query(
      'INSERT INTO active_connections (connection_id, user_id) VALUES ($1, $2) ON CONFLICT (connection_id) DO UPDATE SET user_id = $2, updated_at = NOW()',
      [connectionId, userId]
    );
  }

  async removeConnection(connectionId) {
    await this.pool.query(
      'DELETE FROM active_connections WHERE connection_id = $1',
      [connectionId]
    );
  }

  async getConnection(connectionId) {
    const result = await this.pool.query(
      'SELECT * FROM active_connections WHERE connection_id = $1',
      [connectionId]
    );
    return result.rows[0] || null;
  }

  async getAllConnections(excludeConnectionId = null) {
    let query = 'SELECT * FROM active_connections';
    let params = [];
    
    if (excludeConnectionId) {
      query += ' WHERE connection_id != $1';
      params.push(excludeConnectionId);
    }
    
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getUserById(userId) {
    const result = await this.pool.query(
      'SELECT id, username, email, display_name, avatar, status FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  // Extract JWT from WebSocket connect event
  extractTokenFromEvent(event) {
    // Try query string first
    if (event.queryStringParameters && event.queryStringParameters.token) {
      return event.queryStringParameters.token;
    }
    
    // Try headers
    if (event.headers && event.headers.Authorization) {
      const authHeader = event.headers.Authorization;
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
    }
    
    return null;
  }
}

module.exports = WebSocketHandler;
