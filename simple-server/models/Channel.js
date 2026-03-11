const { pool } = require('../config/database');

class Channel {
  // Create a new channel
  static async create(channelData) {
    const { id, name, serverId, position = 0 } = channelData;
    
    const query = `
      INSERT INTO channels (id, name, server_id, position)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [id, name, serverId, position];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find channel by ID
  static async findById(id) {
    const query = 'SELECT * FROM channels WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get channels for a server
  static async findByServerId(serverId) {
    const query = `
      SELECT * FROM channels 
      WHERE server_id = $1 
      ORDER BY position ASC, created_at ASC
    `;
    
    try {
      const result = await pool.query(query, [serverId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Update channel
  static async update(id, updates) {
    const allowedFields = ['name', 'position'];
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `
      UPDATE channels 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete channel
  static async delete(id) {
    const query = 'DELETE FROM channels WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // Check if user has access to channel
  static async hasAccess(channelId, userId) {
    const query = `
      SELECT c.*, sm.role
      FROM channels c
      JOIN server_members sm ON c.server_id = sm.server_id
      WHERE c.id = $1 AND sm.user_id = $2
    `;
    
    try {
      const result = await pool.query(query, [channelId, userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get channel with recent messages
  static async findByIdWithMessages(id, limit = 50) {
    const channelQuery = 'SELECT * FROM channels WHERE id = $1';
    const messagesQuery = `
      SELECT m.*, u.username, u.display_name, u.avatar
      FROM messages m
      JOIN users u ON m.author_id = u.id
      WHERE m.channel_id = $1
      ORDER BY m.timestamp DESC
      LIMIT $2
    `;
    
    try {
      const [channelResult, messagesResult] = await Promise.all([
        pool.query(channelQuery, [id]),
        pool.query(messagesQuery, [id, limit])
      ]);
      
      if (channelResult.rows.length === 0) return null;
      
      const channel = {
        ...channelResult.rows[0],
        messages: messagesResult.rows.reverse() // Reverse to get chronological order
      };
      
      return channel;
    } catch (error) {
      throw error;
    }
  }

  // Get message count for channel
  static async getMessageCount(channelId) {
    const query = 'SELECT COUNT(*) as count FROM messages WHERE channel_id = $1';
    
    try {
      const result = await pool.query(query, [channelId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  // Reorder channels in a server
  static async reorder(serverId, channelOrders) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const { channelId, position } of channelOrders) {
        await client.query(
          'UPDATE channels SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND server_id = $3',
          [position, channelId, serverId]
        );
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get channels with user permissions
  static async getAccessibleChannels(serverId, userId) {
    const query = `
      SELECT c.*, sm.role as user_role
      FROM channels c
      JOIN server_members sm ON c.server_id = sm.server_id
      WHERE c.server_id = $1 AND sm.user_id = $2
      ORDER BY c.position ASC, c.created_at ASC
    `;
    
    try {
      const result = await pool.query(query, [serverId, userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Channel;
