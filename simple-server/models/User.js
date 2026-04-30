const { pool } = require('../config/database');

class User {
  // Create a new user
  static async create(userData) {
    const { id, username, email, passwordHash, displayName, avatar } = userData;
    
    const query = `
      INSERT INTO users (id, username, email, password_hash, display_name, avatar)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, display_name, avatar, status, created_at
    `;
    
    const values = [id, username, email, passwordHash, displayName || username, avatar];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        if (error.constraint === 'users_username_unique' || error.constraint === 'users_username_key') {
          throw new Error('Username already exists');
        } else if (error.constraint === 'users_email_unique' || error.constraint === 'users_email_key') {
          throw new Error('Email already exists');
        }
      }
      throw error;
    }
  }

  // Find user by email (with password for authentication)
  static async findByEmail(email, includePassword = false) {
    const query = includePassword 
      ? 'SELECT * FROM users WHERE email = $1'
      : 'SELECT id, username, email, display_name, avatar, status, created_at, updated_at FROM users WHERE email = $1';
    
    try {
      const result = await pool.query(query, [email]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find user by username
  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    
    try {
      const result = await pool.query(query, [username]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    const query = `
      SELECT id, username, email, display_name, avatar, status, created_at, updated_at
      FROM users WHERE id = $1
    `;
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update user status
  static async updateStatus(id, status) {
    const query = `
      UPDATE users 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, username, display_name, avatar, status
    `;
    
    try {
      const result = await pool.query(query, [status, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(id, updates) {
    const allowedFields = ['display_name', 'avatar', 'status'];
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
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, email, display_name, avatar, status
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get user's servers
  static async getServers(userId) {
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

  // Get user's direct messages
  static async getDirectMessages(userId) {
    const query = `
      SELECT dm.*, 
             CASE 
               WHEN dm.participants[1] = $1 THEN dm.participants[2]
               ELSE dm.participants[1]
             END as other_user_id
      FROM direct_messages dm
      WHERE $1 = ANY(dm.participants)
      ORDER BY dm.last_message_time DESC
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get user's friends (accepted friend requests)
  static async getFriends(userId) {
    const query = `
      SELECT u.id, u.username, u.display_name, u.avatar, u.status
      FROM users u
      JOIN friend_requests fr ON (
        (fr.from_user_id = $1 AND fr.to_user_id = u.id AND fr.status = 'accepted') OR
        (fr.to_user_id = $1 AND fr.from_user_id = u.id AND fr.status = 'accepted')
      )
      WHERE u.id != $1
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Delete user account
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
