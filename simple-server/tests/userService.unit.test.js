/**
 * Unit tests for services/userService.js (see docs/testing/userService-test-spec.md).
 * Mocks User model, bcrypt, and jwt — no database.
 */
jest.mock('../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  registerUser,
  loginUser,
  getUserById,
  getAllUsers,
  logoutUser,
  initializeDemoAccounts,
} = require('../services/userService');

describe('userService (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '7d';
  });

  describe('registerUser', () => {
    test('hashes password, creates user, returns token', async () => {
      const created = {
        id: '99',
        username: 'newuser',
        email: 'new@test.com',
        display_name: 'newuser',
      };
      const onlineUser = {
        ...created,
        status: 'online',
      };
      bcrypt.hash.mockResolvedValue('hashed-secret');
      User.create.mockResolvedValue(created);
      User.updateStatus.mockResolvedValue(onlineUser);
      jwt.sign.mockReturnValue('signed.jwt');

      const result = await registerUser({
        username: 'newuser',
        email: 'new@test.com',
        password: 'secret12',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('secret12', 10);
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'newuser',
          email: 'new@test.com',
          passwordHash: 'hashed-secret',
        })
      );
      expect(User.updateStatus).toHaveBeenCalledWith('99', 'online');
      expect(jwt.sign).toHaveBeenCalled();
      expect(result).toEqual({ user: onlineUser, token: 'signed.jwt' });
    });
  });

  describe('loginUser', () => {
    test('returns user and token when credentials are valid', async () => {
      const withHash = {
        id: '1',
        email: 'a@b.com',
        password_hash: 'stored-hash',
      };
      const onlineUser = {
        id: '1',
        email: 'a@b.com',
        username: 'A',
        status: 'online',
      };
      User.findByEmail.mockResolvedValue(withHash);
      bcrypt.compare.mockResolvedValue(true);
      User.updateStatus.mockResolvedValue(onlineUser);
      jwt.sign.mockReturnValue('login.jwt');

      const result = await loginUser({ email: 'a@b.com', password: 'ok' });

      expect(bcrypt.compare).toHaveBeenCalledWith('ok', 'stored-hash');
      expect(User.updateStatus).toHaveBeenCalledWith('1', 'online');
      expect(result).toEqual({ user: onlineUser, token: 'login.jwt' });
    });

    test('throws when email is not found', async () => {
      User.findByEmail.mockResolvedValue(undefined);

      await expect(
        loginUser({ email: 'nobody@test.com', password: 'x' })
      ).rejects.toThrow('Invalid email or password');
    });

    test('throws when password does not match', async () => {
      User.findByEmail.mockResolvedValue({
        id: '1',
        password_hash: 'h',
      });
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        loginUser({ email: 'a@b.com', password: 'wrong' })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('logoutUser', () => {
    test('sets user status to offline', async () => {
      const offlineUser = {
        id: '1',
        username: 'testuser',
        display_name: 'Test User',
        avatar: 'https://example.com/avatar.png',
        status: 'offline',
      };
      User.updateStatus.mockResolvedValue(offlineUser);

      const result = await logoutUser('1');

      expect(User.updateStatus).toHaveBeenCalledWith('1', 'offline');
      expect(result).toEqual(offlineUser);
    });
  });

  describe('getUserById', () => {
    test('delegates to User.findById', async () => {
      User.findById.mockResolvedValue({ id: '42' });
      await expect(getUserById('42')).resolves.toEqual({ id: '42' });
      expect(User.findById).toHaveBeenCalledWith('42');
    });
  });

  describe('getAllUsers', () => {
    test('returns empty array', async () => {
      await expect(getAllUsers()).resolves.toEqual([]);
    });
  });

  describe('initializeDemoAccounts', () => {
    test('does not seed when nafisa@example.com already exists', async () => {
      User.findByEmail.mockResolvedValue({ id: '1' });

      await initializeDemoAccounts();

      expect(User.findByEmail).toHaveBeenCalledWith('nafisa@example.com');
      expect(User.create).not.toHaveBeenCalled();
    });

    test('creates five demo users when none exist', async () => {
      User.findByEmail.mockResolvedValue(null);
      User.create.mockImplementation((u) => Promise.resolve({ id: u.id, email: u.email }));

      await initializeDemoAccounts();

      expect(User.create).toHaveBeenCalledTimes(5);
      const emails = User.create.mock.calls.map((c) => c[0].email);
      expect(emails).toEqual(
        expect.arrayContaining([
          'nafisa@example.com',
          'ashraf@example.com',
          'james@example.com',
          'elvis@example.com',
          'salma@example.com',
        ])
      );
    });

    test('swallows errors from User.findByEmail', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      User.findByEmail.mockRejectedValue(new Error('db down'));

      await expect(initializeDemoAccounts()).resolves.toBeUndefined();

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
