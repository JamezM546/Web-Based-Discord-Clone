/**
 * Cloud-only integration tests.
 * Set INTEGRATION_TEST_API_URL to your API Gateway base URL (no trailing slash),
 * e.g. https://xxxx.execute-api.us-east-1.amazonaws.com/prod
 *
 * Skipped on localhost CI; run manually or in a workflow with that secret.
 */
const base = (process.env.INTEGRATION_TEST_API_URL || '').replace(/\/$/, '');

const runDeployed = base ? describe : describe.skip;

async function fetchJson(url, options = {}) {
  const headers = {
    Connection: 'close',
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  return { res, body: await res.json() };
}

runDeployed('Integration — deployed API (API Gateway + Lambda)', () => {
  afterAll(async () => {
    // Give Node a moment to close fetch TLS sockets before Jest exits.
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  test('GET /health', async () => {
    const { res, body } = await fetchJson(`${base}/health`);
    expect(res.ok).toBe(true);
    expect(body.success).toBe(true);
  });

  test('POST /api/auth/login returns token for seeded demo user', async () => {
    const { res, body } = await fetchJson(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nafisa@example.com',
        password: 'password123',
      }),
    });
    expect(res.ok).toBe(true);
    expect(body.data?.token).toBeDefined();
  });

  test('GET /api/servers with Bearer token', async () => {
    const { body: loginBody } = await fetchJson(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nafisa@example.com',
        password: 'password123',
      }),
    });
    const { data } = loginBody;
    const token = data.token;

    const { res, body } = await fetchJson(`${base}/api/servers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok).toBe(true);
    expect(Array.isArray(body.data?.servers)).toBe(true);
  });
});
