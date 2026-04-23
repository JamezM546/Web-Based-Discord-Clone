const { pool } = require('../config/database');

class InviteCode {
  static generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  static async create(data) {
    const { serverId, createdBy, expiresAt, maxUses } = data;
    const id = `ic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const code = this.generateCode();

    const query = `
      INSERT INTO server_invite_codes (id, code, server_id, created_by, expires_at, max_uses, uses_count)
      VALUES ($1, $2, $3, $4, $5, $6, 0)
      RETURNING *
    `;

    const values = [id, code, serverId, createdBy, expiresAt || null, maxUses || 0];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByCode(code) {
    const query = `
      SELECT ic.*,
             s.name as server_name, s.icon as server_icon,
             u.username as creator_username, u.display_name as creator_display_name
      FROM server_invite_codes ic
      JOIN servers s ON ic.server_id = s.id
      JOIN users u ON ic.created_by = u.id
      WHERE ic.code = $1
    `;

    try {
      const result = await pool.query(query, [code]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM server_invite_codes WHERE id = $1';

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findByServer(serverId) {
    const query = `
      SELECT ic.*,
             u.username as creator_username, u.display_name as creator_display_name
      FROM server_invite_codes ic
      JOIN users u ON ic.created_by = u.id
      WHERE ic.server_id = $1
      ORDER BY ic.created_at DESC
    `;

    try {
      const result = await pool.query(query, [serverId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async isValid(code) {
    const invite = await this.findByCode(code);
    if (!invite) return { valid: false, reason: 'Invalid invite code' };

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return { valid: false, reason: 'Invite has expired', invite };
    }

    if (invite.max_uses > 0 && invite.uses_count >= invite.max_uses) {
      return { valid: false, reason: 'Invite has reached max uses', invite };
    }

    return { valid: true, invite };
  }

  static async use(code) {
    const query = `
      UPDATE server_invite_codes
      SET uses_count = uses_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE code = $1
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [code]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM server_invite_codes WHERE id = $1';

    try {
      const result = await pool.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  static async deleteByServerAndId(serverId, id) {
    const query = 'DELETE FROM server_invite_codes WHERE id = $1 AND server_id = $2';

    try {
      const result = await pool.query(query, [id, serverId]);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = InviteCode;
