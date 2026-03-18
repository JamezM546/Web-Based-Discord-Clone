const { pool } = require('../config/database');

class Server {
  // Create a new server
  static async create(serverData) {
    const { id, name, icon, ownerId } = serverData;
    
    const query = `
      INSERT INTO servers (id, name, icon, owner_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [id, name, icon, ownerId];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find server by ID
  static async findById(id) {
    const query = 'SELECT * FROM servers WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get server with members
  static async findByIdWithMembers(id) {
    const query = `
      SELECT s.*, 
             u.id as user_id, u.username, u.display_name, u.avatar, u.status,
             sm.role, sm.joined_at
      FROM servers s
      LEFT JOIN server_members sm ON s.id = sm.server_id
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE s.id = $1
    `;
    
    try {
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) return null;
      
      const server = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        icon: result.rows[0].icon,
        ownerId: result.rows[0].owner_id,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
        members: result.rows.map(row => ({
          id: row.user_id,
          username: row.username,
          displayName: row.display_name,
          avatar: row.avatar,
          status: row.status,
          role: row.role,
          joinedAt: row.joined_at
        })).filter(member => member.id) // Filter out null members
      };
      
      return server;
    } catch (error) {
      throw error;
    }
  }

  // Get server with channels
  static async findByIdWithChannels(id) {
    const query = `
      SELECT s.*, 
             c.id as channel_id, c.name as channel_name, c.position
      FROM servers s
      LEFT JOIN channels c ON s.id = c.server_id
      WHERE s.id = $1
      ORDER BY c.position ASC, c.created_at ASC
    `;
    
    try {
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) return null;
      
      const server = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        icon: result.rows[0].icon,
        ownerId: result.rows[0].owner_id,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
        channels: result.rows.map(row => ({
          id: row.channel_id,
          name: row.channel_name,
          position: row.position
        })).filter(channel => channel.id) // Filter out null channels
      };
      
      return server;
    } catch (error) {
      throw error;
    }
  }

  // Add member to server
  static async addMember(serverId, userId, role = 'member') {
    const id = `sm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const query = `
      INSERT INTO server_members (id, server_id, user_id, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [id, serverId, userId, role]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('User is already a member of this server');
      }
      throw error;
    }
  }

  // Remove member from server
  static async removeMember(serverId, userId) {
    const query = 'DELETE FROM server_members WHERE server_id = $1 AND user_id = $2';
    
    try {
      const result = await pool.query(query, [serverId, userId]);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // Update member role
  static async updateMemberRole(serverId, userId, role) {
    const query = `
      UPDATE server_members 
      SET role = $1
      WHERE server_id = $2 AND user_id = $3
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [role, serverId, userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get servers for a user
  static async findByUserId(userId) {
    const query = `
      SELECT s.*, sm.role, sm.joined_at
      FROM servers s
      JOIN server_members sm ON s.id = sm.server_id
      WHERE sm.user_id = $1
      ORDER BY sm.joined_at DESC
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Update server
  static async update(id, updates) {
    const allowedFields = ['name', 'icon'];
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
      UPDATE servers 
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

  // Delete server
  static async delete(id) {
    const query = 'DELETE FROM servers WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // Check if user is member of server
  static async isMember(serverId, userId) {
    const query = 'SELECT role FROM server_members WHERE server_id = $1 AND user_id = $2';
    
    try {
      const result = await pool.query(query, [serverId, userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get server members count
  static async getMemberCount(serverId) {
    const query = 'SELECT COUNT(*) as count FROM server_members WHERE server_id = $1';
    
    try {
      const result = await pool.query(query, [serverId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Server;
