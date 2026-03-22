/**
 * Tests for the Friends module — list, requests, send, accept, reject.
 *
 * Seed data: Nafisa (1) is friends with Ashraf (2), James (3), Salma (5).
 * Elvis (4) has a pending request to Nafisa.
 */
const { request, getToken, login, ensureInit } = require('./setup');

beforeAll(() => ensureInit(), 30000);

describe('Friends — GET /api/friends', () => {
  test('returns the accepted friends list', async () => {
    const res = await request
      .get('/api/friends')
      .set('Authorization', `Bearer ${getToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.friends).toBeInstanceOf(Array);
    expect(res.body.data.friends.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Friends — GET /api/friends/requests', () => {
  // Do not rely on seed row fr4 (Elvis→Nafisa): it may be accepted/removed after UI or old DBs.
  beforeAll(async () => {
    const meRes = await request
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${getToken()}`);
    const nafisaId = meRes.body.data.user.id;
    const u = `frpend${Date.now()}`;
    const reg = await request.post('/api/auth/register').send({
      username: u,
      email: `${u}@test.com`,
      password: 'pass1234',
    });
    const outsiderToken = reg.body.data.token;
    await request
      .post('/api/friends/requests')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ toUserId: nafisaId });
  });

  test('returns pending friend requests', async () => {
    const res = await request
      .get('/api/friends/requests')
      .set('Authorization', `Bearer ${getToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.requests).toBeInstanceOf(Array);
    const pending = res.body.data.requests.filter(r => r.status === 'pending');
    expect(pending.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Friends — POST send / accept / reject', () => {
  let senderToken;
  let receiverToken;
  let receiverId;
  let requestId;

  beforeAll(async () => {
    const s = `frsend${Date.now()}`;
    const r = `frrecv${Date.now()}`;
    const sRes = await request.post('/api/auth/register').send({
      username: s, email: `${s}@test.com`, password: 'pass1234',
    });
    senderToken = sRes.body.data.token;

    const rRes = await request.post('/api/auth/register').send({
      username: r, email: `${r}@test.com`, password: 'pass1234',
    });
    receiverToken = rRes.body.data.token;
    receiverId = rRes.body.data.user.id;
  });

  test('POST /api/friends/requests sends a friend request', async () => {
    const res = await request
      .post('/api/friends/requests')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ toUserId: receiverId });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    requestId = res.body.data.request.id;
  });

  test('POST /api/friends/requests/:id/accept accepts a request', async () => {
    if (!requestId) return;
    const res = await request
      .post(`/api/friends/requests/${requestId}/accept`)
      .set('Authorization', `Bearer ${receiverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('prevents duplicate friend requests (already friends)', async () => {
    const res = await request
      .post('/api/friends/requests')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ toUserId: receiverId });

    expect(res.status).toBe(400);
  });
});
