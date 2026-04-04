/**
 * Unit tests for models/User.js (see docs/testing/User-model-test-spec.md).
 * Mocks pg pool — no PostgreSQL.
 */
jest.mock('../config/database', () => ({
  pool: { query: jest.fn() },
}));

const { pool } = require('../config/database');
const User = require('../models/User');

describe('User model (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('returns inserted row on success', async () => {
      const row = { id: '1', username: 'U' };
      pool.query.mockResolvedValue({ rows: [row] });

      const result = await User.create({
        id: '1',
        username: 'U',
        email: 'u@test.com',
        passwordHash: 'h',
        displayName: 'U',
        avatar: 'a',
      });

      expect(result).toEqual(row);
      expect(pool.query).toHaveBeenCalled();
    });

    test('maps username unique violation', async () => {
      const err = Object.assign(new Error('dup'), {
        code: '23505',
        constraint: 'users_username_unique',
      });
      pool.query.mockRejectedValue(err);

      await expect(
        User.create({
          id: '1',
          username: 'U',
          email: 'u@test.com',
          passwordHash: 'h',
        })
      ).rejects.toThrow('Username already exists');
    });

    test('maps email unique violation', async () => {
      const err = Object.assign(new Error('dup'), {
        code: '23505',
        constraint: 'users_email_unique',
      });
      pool.query.mockRejectedValue(err);

      await expect(
        User.create({
          id: '1',
          username: 'U',
          email: 'u@test.com',
          passwordHash: 'h',
        })
      ).rejects.toThrow('Email already exists');
    });

    test('rethrows other unique violations on create', async () => {
      const err = Object.assign(new Error('dup'), {
        code: '23505',
        constraint: 'other_constraint',
      });
      pool.query.mockRejectedValue(err);

      await expect(
        User.create({
          id: '1',
          username: 'U',
          email: 'u@test.com',
          passwordHash: 'h',
        })
      ).rejects.toBe(err);
    });

    test('rethrows non-unique errors', async () => {
      const err = new Error('connection failed');
      pool.query.mockRejectedValue(err);

      await expect(
        User.create({
          id: '1',
          username: 'U',
          email: 'u@test.com',
          passwordHash: 'h',
        })
      ).rejects.toBe(err);
    });
  });

  describe('findByEmail', () => {
    test('uses public projection when includePassword is false', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: '1' }] });

      await User.findByEmail('e@test.com', false);

      const q = pool.query.mock.calls[0][0];
      expect(q).not.toMatch(/SELECT \*/i);
      expect(q).not.toMatch(/password_hash/i);
      expect(q).toContain('WHERE email = $1');
    });

    test('selects all columns when includePassword is true', async () => {
      pool.query.mockResolvedValue({ rows: [{ password_hash: 'x' }] });

      await User.findByEmail('e@test.com', true);

      expect(pool.query.mock.calls[0][0]).toMatch(/SELECT \* FROM users/i);
    });

    test('propagates query failures', async () => {
      const err = new Error('timeout');
      pool.query.mockRejectedValue(err);

      await expect(User.findByEmail('x@test.com')).rejects.toBe(err);
    });
  });

  describe('findByUsername', () => {
    test('returns first row', async () => {
      pool.query.mockResolvedValue({ rows: [{ username: 'bob' }] });

      await expect(User.findByUsername('bob')).resolves.toEqual({
        username: 'bob',
      });
    });
  });

  describe('findById', () => {
    test('returns user row', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: '7' }] });

      await expect(User.findById('7')).resolves.toEqual({ id: '7' });
    });
  });

  describe('updateStatus', () => {
    test('returns updated row', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: '1', status: 'online' }] });

      await expect(User.updateStatus('1', 'online')).resolves.toEqual({
        id: '1',
        status: 'online',
      });
    });
  });

  describe('updateProfile', () => {
    test('updates allowed snake_case fields', async () => {
      pool.query.mockResolvedValue({
        rows: [{ id: '1', display_name: 'New' }],
      });

      const row = await User.updateProfile('1', { display_name: 'New' });

      expect(row.display_name).toBe('New');
      const q = pool.query.mock.calls[0][0];
      expect(q).toContain('display_name = $1');
    });

    test('throws when no valid fields', async () => {
      await expect(
        User.updateProfile('1', { unknown: 'x' })
      ).rejects.toThrow('No valid fields to update');
      expect(pool.query).not.toHaveBeenCalled();
    });

    test('propagates database errors', async () => {
      const err = new Error('deadlock');
      pool.query.mockRejectedValue(err);

      await expect(
        User.updateProfile('1', { display_name: 'X' })
      ).rejects.toBe(err);
    });
  });

  describe('getServers', () => {
    test('returns rows from pool', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 's1' }] });

      await expect(User.getServers('u1')).resolves.toEqual([{ id: 's1' }]);
    });
  });

  describe('getDirectMessages', () => {
    test('returns rows from pool', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 'dm1' }] });

      await expect(User.getDirectMessages('u1')).resolves.toEqual([
        { id: 'dm1' },
      ]);
    });
  });

  describe('getFriends', () => {
    test('returns rows from pool', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 'f1' }] });

      await expect(User.getFriends('u1')).resolves.toEqual([{ id: 'f1' }]);
    });
  });

  describe('delete', () => {
    test('returns true when a row was deleted', async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      await expect(User.delete('9')).resolves.toBe(true);
    });

    test('returns false when no row deleted', async () => {
      pool.query.mockResolvedValue({ rowCount: 0 });

      await expect(User.delete('missing')).resolves.toBe(false);
    });
  });
});
