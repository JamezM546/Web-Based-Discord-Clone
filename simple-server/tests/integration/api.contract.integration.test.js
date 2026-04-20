/**
 * Integration tests: HTTP paths the SPA uses (login → authorized API).
 * Requires PostgreSQL (same as other backend suites). See docs/INTEGRATION_TEST_SPEC.md.
 */
const { request, ensureInit, cleanup } = require('../setup');

beforeAll(() => ensureInit(), 60000);

afterAll(() => cleanup());

describe('Integration — SPA API contract (localhost)', () => {
  test('health is reachable without auth', async () => {
    const res = await request.get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('login then list servers (mirrors apiService auth + servers)', async () => {
    const loginRes = await request.post('/api/auth/login').send({
      email: 'nafisa@example.com',
      password: 'password123',
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data?.token).toBeDefined();

    const token = loginRes.body.data.token;
    const serversRes = await request.get('/api/servers').set('Authorization', `Bearer ${token}`);
    expect(serversRes.status).toBe(200);
    expect(serversRes.body.success).toBe(true);
    expect(Array.isArray(serversRes.body.data?.servers)).toBe(true);
  });

  test('login then load channels for first server', async () => {
    const loginRes = await request.post('/api/auth/login').send({
      email: 'nafisa@example.com',
      password: 'password123',
    });
    const token = loginRes.body.data.token;
    const serversRes = await request.get('/api/servers').set('Authorization', `Bearer ${token}`);
    const first = serversRes.body.data.servers[0];
    expect(first?.id).toBeDefined();

    const chRes = await request
      .get(`/api/channels/server/${first.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(chRes.status).toBe(200);
    expect(Array.isArray(chRes.body.data?.channels)).toBe(true);
  });
});
