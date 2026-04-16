/**
 * Tests for User Story 1 (Manual Summary On Demand) and
 * User Story 2 (What You Missed Preview).
 *
 * Full API path: authentication → access control → summary generation.
 * Seed data: server s1, channel c1 (10 messages), DM dm1 (3 messages).
 */
const { request, getToken, login, ensureInit } = require('./setup');

beforeAll(() => ensureInit(), 30000);

describe('User Story 1 — Manual Summary On Demand (POST /api/summaries/manual)', () => {
  test('returns a summary for a seeded channel', async () => {
    const res = await request
      .post('/api/summaries/manual')
      .set('Authorization', `Bearer ${getToken()}`)
      // Use a wide window so this remains stable even when the dev/test DB persists across runs.
      .send({ channelId: 'c1', hours: 24 * 365 * 5 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const summary = res.body.data.summary;
    expect(summary).toBeDefined();
    expect(summary.overview).toEqual(expect.any(String));
    expect(summary.keyTopics).toEqual(expect.any(Array));
    expect(summary.mostActiveUsers).toEqual(expect.any(Array));
    expect(summary.timeframe).toEqual(expect.any(String));
    expect(summary.stats.totalMessages).toBeGreaterThan(0);
    expect(summary.stats.uniqueUsers).toBeGreaterThan(0);
  });

  test('returns a summary for a DM', async () => {
    const res = await request
      .post('/api/summaries/manual')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ dmId: 'dm1', hours: 168 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.stats.totalMessages).toBeGreaterThanOrEqual(0);
  });

  test('respects optional hours/maxMessages parameters', async () => {
    const res = await request
      .post('/api/summaries/manual')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ channelId: 'c1', hours: 1, maxMessages: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data.summary.stats.totalMessages).toBeLessThanOrEqual(5);
  });

  test('rejects when neither channelId nor dmId is provided', async () => {
    const res = await request
      .post('/api/summaries/manual')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rejects when both channelId and dmId are provided', async () => {
    const res = await request
      .post('/api/summaries/manual')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ channelId: 'c1', dmId: 'dm1' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rejects unauthenticated requests', async () => {
    const res = await request
      .post('/api/summaries/manual')
      .send({ channelId: 'c1' });

    expect(res.status).toBe(401);
  });

  test('rejects access to a channel the user is not a member of', async () => {
    const uid = `outsider_ms_${Date.now()}`;
    await request.post('/api/auth/register').send({
      username: `outsiderms${Date.now()}`,
      email: `${uid}@test.com`,
      password: 'password123',
    });
    const outsiderToken = await login(`${uid}@test.com`, 'password123');

    const res = await request
      .post('/api/summaries/manual')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ channelId: 'c1', hours: 168 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('rejects access to a DM the user is not a participant of', async () => {
    const uid = `outsiderdm_${Date.now()}`;
    await request.post('/api/auth/register').send({
      username: `outsiderdm${Date.now()}`,
      email: `${uid}@test.com`,
      password: 'password123',
    });
    const outsiderToken = await login(`${uid}@test.com`, 'password123');

    const res = await request
      .post('/api/summaries/manual')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ dmId: 'dm1', hours: 168 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

describe('User Story 2 — What You Missed Preview (GET /api/summaries/preview)', () => {
  test('returns a preview for a seeded channel', async () => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await request
      .get('/api/summaries/preview')
      .set('Authorization', `Bearer ${getToken()}`)
      .query({ channelId: 'c1', since });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const preview = res.body.data.preview;
    expect(preview).toBeDefined();
    expect(preview.summary).toEqual(expect.any(String));
    expect(preview.unreadCount).toEqual(expect.any(Number));
    expect(preview.participants).toEqual(expect.any(Array));
  });

  test('accepts a `since` timestamp to scope the preview', async () => {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const res = await request
      .get('/api/summaries/preview')
      .set('Authorization', `Bearer ${getToken()}`)
      .query({ channelId: 'c1', since });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.preview.summary).toEqual(expect.any(String));
  });

  test('works for a DM conversation', async () => {
    const res = await request
      .get('/api/summaries/preview')
      .set('Authorization', `Bearer ${getToken()}`)
      .query({ dmId: 'dm1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('rejects when neither channelId nor dmId is provided', async () => {
    const res = await request
      .get('/api/summaries/preview')
      .set('Authorization', `Bearer ${getToken()}`)
      .query({});

    expect(res.status).toBe(400);
  });

  test('rejects unauthenticated requests', async () => {
    const res = await request
      .get('/api/summaries/preview')
      .query({ channelId: 'c1' });

    expect(res.status).toBe(401);
  });

  test('rejects access to a channel the user is not a member of', async () => {
    const uid = `outsiderpv_${Date.now()}`;
    await request.post('/api/auth/register').send({
      username: `outsiderpv${Date.now()}`,
      email: `${uid}@test.com`,
      password: 'password123',
    });
    const outsiderToken = await login(`${uid}@test.com`, 'password123');

    const res = await request
      .get('/api/summaries/preview')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .query({ channelId: 'c1' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
