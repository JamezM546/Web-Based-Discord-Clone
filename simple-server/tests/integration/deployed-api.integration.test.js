/**
 * Cloud-only integration tests.
 * Set INTEGRATION_TEST_API_URL to your API Gateway base URL (no trailing slash),
 * e.g. https://xxxx.execute-api.us-east-1.amazonaws.com/prod
 *
 * Skipped on localhost CI; run manually or in a workflow with that secret.
 */
const base = (process.env.INTEGRATION_TEST_API_URL || '').replace(/\/$/, '');

const runDeployed = base ? describe : describe.skip;

runDeployed('Integration — deployed API (API Gateway + Lambda)', () => {
  test('GET /health', async () => {
    const res = await fetch(`${base}/health`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('POST /api/auth/login returns token for seeded demo user', async () => {
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nafisa@example.com',
        password: 'password123',
      }),
    });
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.data?.token).toBeDefined();
  });

  test('GET /api/servers with Bearer token', async () => {
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nafisa@example.com',
        password: 'password123',
      }),
    });
    const { data } = await loginRes.json();
    const token = data.token;

    const res = await fetch(`${base}/api/servers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.data?.servers)).toBe(true);
  });
});
