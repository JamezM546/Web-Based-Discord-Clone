const { request, getToken, login, ensureInit } = require('./setup');

beforeAll(() => ensureInit(), 30000);

describe('Invite codes', () => {
  test('returns success when an existing member joins via invite code', async () => {
    const createRes = await request
      .post('/api/invite-codes/s1')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({});

    expect(createRes.status).toBe(201);
    const code = createRes.body.data.invite.code;
    expect(code).toBeDefined();

    const joinRes = await request
      .post(`/api/invite-codes/${code}/join`)
      .set('Authorization', `Bearer ${getToken()}`);

    expect(joinRes.status).toBe(200);
    expect(joinRes.body.success).toBe(true);
    expect(joinRes.body.data.alreadyMember).toBe(true);
    expect(joinRes.body.data.server.id).toBe('s1');
  });

  test('adds a new member to the server via invite code', async () => {
    const unique = `invitecode${Date.now()}`;
    const registerRes = await request.post('/api/auth/register').send({
      username: unique,
      email: `${unique}@test.com`,
      password: 'pass1234',
    });

    expect(registerRes.status).toBe(201);
    const joinToken = await login(`${unique}@test.com`, 'pass1234');

    const createRes = await request
      .post('/api/invite-codes/s1')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({});

    expect(createRes.status).toBe(201);
    const code = createRes.body.data.invite.code;

    const joinRes = await request
      .post(`/api/invite-codes/${code}/join`)
      .set('Authorization', `Bearer ${joinToken}`);

    expect(joinRes.status).toBe(200);
    expect(joinRes.body.success).toBe(true);
    expect(joinRes.body.data.alreadyMember).toBe(false);
    expect(joinRes.body.data.server.id).toBe('s1');
  });
});
