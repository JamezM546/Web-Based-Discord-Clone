/**
 * Tests for the Authentication module.
 *
 * Covers: registration, login, token-protected routes, and invalid credentials.
 * These endpoints are prerequisites for every user story.
 */
const { request, getToken, ensureInit } = require('./setup');

beforeAll(() => ensureInit(), 30000);

describe('Auth — POST /api/auth/login', () => {
  test('logs in with valid demo credentials', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: 'nafisa@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.username).toBe('Nafisa');
  });

  test('rejects invalid password', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: 'nafisa@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('rejects non-existent email', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('Auth — POST /api/auth/register', () => {
  test('registers a new user', async () => {
    const unique = `tester${Date.now()}`;
    const res = await request
      .post('/api/auth/register')
      .send({ username: unique, email: `${unique}@test.com`, password: 'pass1234' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.username).toBe(unique);
  });

  test('rejects duplicate email', async () => {
    const res = await request
      .post('/api/auth/register')
      .send({ username: 'Nafisa2', email: 'nafisa@example.com', password: 'pass1234' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Auth — GET /api/auth/me', () => {
  test('returns current user with valid token', async () => {
    const res = await request
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${getToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.id).toBeDefined();
  });

  test('rejects request without token', async () => {
    const res = await request.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('rejects request with invalid token', async () => {
    const res = await request
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.status).toBe(403);
  });
});

describe('Auth - PUT /api/users/me/password', () => {
  test('resets the password for an authenticated user and allows login with the new password', async () => {
    const unique = `resetuser${Date.now()}`;
    const email = `${unique}@test.com`;
    const originalPassword = 'pass1234';
    const newPassword = 'newpass5678';

    const registerRes = await request
      .post('/api/auth/register')
      .send({ username: unique, email, password: originalPassword });

    expect(registerRes.status).toBe(201);

    const token = registerRes.body.data.token;
    const resetRes = await request
      .put('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: originalPassword, newPassword });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    const oldLoginRes = await request
      .post('/api/auth/login')
      .send({ email, password: originalPassword });

    expect(oldLoginRes.status).toBe(401);

    const newLoginRes = await request
      .post('/api/auth/login')
      .send({ email, password: newPassword });

    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.success).toBe(true);
    expect(newLoginRes.body.data.token).toBeDefined();
  });

  test('rejects reset when the current password is incorrect', async () => {
    const res = await request
      .put('/api/users/me/password')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ currentPassword: 'wrong-password', newPassword: 'betterpass123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rejects reset when the new password matches the current password', async () => {
    const res = await request
      .put('/api/users/me/password')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ currentPassword: 'password123', newPassword: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
