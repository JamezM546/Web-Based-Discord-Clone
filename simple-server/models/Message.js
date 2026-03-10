const { pool } = require('../config/database');

class Message {
  // Create a new message
  static async create(messageData) {
    const { id, content, authorId, channelId, dmId, replyToId, serverInviteId } = messageData;
    
    const query = `
      INSERT INTO messages (id, content, author_id, channel_id, dm_id, reply_to_id, server_invite_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [id, content, authorId, channelId, dmId, replyToId, serverInviteId];
    
    try {
      const result = await pool.query(query, values);
      
      // Update last_message_time for DM if applicable
      if (dmId) {
        await pool.query(
          'UPDATE direct_messages SET last_message_time = CURRENT_TIMESTAMP WHERE id = $1',
          [dmId]
        );
      }
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find message by ID
  static async findById(id) {
    const query = `
      SELECT m.*, u.username, u.display_name, u.avatar
      FROM messages m
      JOIN users u ON m.author_id = u.id
      WHERE m.id = $1
    `;
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get messages for a channel
  static async findByChannelId(channelId, limit = 50, before = null) {
    let query = `
      SELECT m.*, u.username, u.display_name, u.avatar
      FROM messages m
      JOIN users u ON m.author_id = u.id
      WHERE m.channel_id = $1
    `;
    
    const values = [channelId];
    
    if (before) {
      query += ' AND m.timestamp < $2';
      values.push(before);
    }
    
    query += ' ORDER BY m.timestamp DESC LIMIT $' + (values.length + 1);
    values.push(limit);
    
    try {
      const result = await pool.query(query, values);
      return result.rows.reverse(); // Reverse to get chronological order
    } catch (error) {
      throw error;
    }
  }

  // Get messages for a DM
  static async findByDmId(dmId, limit = 50, before = null) {
    let query = `
      SELECT m.*, u.username, u.display_name, u.avatar
      FROM messages m
      JOIN users u ON m.author_id = u.id
      WHERE m.dm_id = $1
    `;
    
    const values = [dmId];
    
    if (before) {
      query += ' AND m.timestamp < $2';
      values.push(before);
    }
    
    query += ' ORDER BY m.timestamp DESC LIMIT $' + (values.length + 1);
    values.push(limit);
    
    try {
      const result = await pool.query(query, values);
      return result.rows.reverse(); // Reverse to get chronological order
    } catch (error) {
      throw error;
    }
  }

  // Update message content
  static async update(id, content) {
    const query = `
      UPDATE messages 
      SET content = $1, edited = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [content, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete message
  static async delete(id) {
    const query = 'DELETE FROM messages WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // Add reaction to message
  static async addReaction(messageId, emoji, userId) {
    const id = `mr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const query = `
      INSERT INTO message_reactions (id, message_id, emoji, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [id, messageId, emoji, userId]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('User has already reacted with this emoji');
      }
      throw error;
    }
  }

  // Remove reaction from message
  static async removeReaction(messageId, emoji, userId) {
    const query = `
      DELETE FROM message_reactions 
      WHERE message_id = $1 AND emoji = $2 AND user_id = $3
    `;
    
    try {
      const result = await pool.query(query, [messageId, emoji, userId]);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get message reactions
  static async getReactions(messageId) {
    const query = `
      SELECT mr.*, u.username, u.display_name
      FROM message_reactions mr
      JOIN users u ON mr.user_id = u.id
      WHERE mr.message_id = $1
      ORDER BY mr.created_at ASC
    `;
    
    try {
      const result = await pool.query(query, [messageId]);
      
      // Group reactions by emoji
      const reactions = {};
      result.rows.forEach(reaction => {
        if (!reactions[reaction.emoji]) {
          reactions[reaction.emoji] = {
            emoji: reaction.emoji,
            users: []
          };
        }
        reactions[reaction.emoji].users.push({
          id: reaction.user_id,
          username: reaction.username,
          displayName: reaction.display_name
        });
      });
      
      return Object.values(reactions);
    } catch (error) {
      throw error;
    }
  }

  // Get message with reactions
  static async findByIdWithReactions(id) {
    const messageQuery = `
      SELECT m.*, u.username, u.display_name, u.avatar
      FROM messages m
      JOIN users u ON m.author_id = u.id
      WHERE m.id = $1
    `;
    
    try {
      const [messageResult, reactions] = await Promise.all([
        pool.query(messageQuery, [id]),
        this.getReactions(id)
      ]);
      
      if (messageResult.rows.length === 0) return null;
      
      return {
        ...messageResult.rows[0],
        reactions
      };
    } catch (error) {
      throw error;
    }
  }

  // Search messages in channel
  static async searchInChannel(channelId, searchTerm, limit = 20) {
    const query = `
      SELECT m.*, u.username, u.display_name, u.avatar
      FROM messages m
      JOIN users u ON m.author_id = u.id
      WHERE m.channel_id = $1 AND m.content ILIKE $2
      ORDER BY m.timestamp DESC
      LIMIT $3
    `;
    
    try {
      const result = await pool.query(query, [channelId, `%${searchTerm}%`, limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Search messages in DM
  static async searchInDm(dmId, searchTerm, limit = 20) {
    const query = `
      SELECT m.*, u.username, u.display_name, u.avatar
      FROM messages m
      JOIN users u ON m.author_id = u.id
      WHERE m.dm_id = $1 AND m.content ILIKE $2
      ORDER BY m.timestamp DESC
      LIMIT $3
    `;
    
    try {
      const result = await pool.query(query, [dmId, `%${searchTerm}%`, limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get message count for channel
  static async getChannelMessageCount(channelId) {
    const query = 'SELECT COUNT(*) as count FROM messages WHERE channel_id = $1';
    
    try {
      const result = await pool.query(query, [channelId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  // Get message count for DM
  static async getDmMessageCount(dmId) {
    const query = 'SELECT COUNT(*) as count FROM messages WHERE dm_id = $1';
    
    try {
      const result = await pool.query(query, [dmId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  // Check if user can access message
  static async hasAccess(messageId, userId) {
    const query = `
      SELECT m.*, 
             CASE 
               WHEN m.channel_id IS NOT NULL THEN (
                 SELECT 1 FROM server_members sm
                 JOIN channels c ON sm.server_id = c.server_id
                 WHERE c.id = m.channel_id AND sm.user_id = $2
               )
               WHEN m.dm_id IS NOT NULL THEN (
                 SELECT 1 FROM direct_messages dm
                 WHERE dm.id = m.dm_id AND $2 = ANY(dm.participants)
               )
               ELSE NULL
             END as has_access
      FROM messages m
      WHERE m.id = $1
    `;
    
    try {
      const result = await pool.query(query, [messageId, userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Message;
