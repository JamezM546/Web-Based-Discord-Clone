/**
 * Consolidated messages tests — combines integration and unit tests
 * from the previous tests/messages/* files into a single file.
 */
// Integration helpers
const { request, getToken, ensureInit } = require('./setup');

beforeAll(() => ensureInit(), 30000);

describe('Messages — integration (channels & DMs + CRUD + reactions)', () => {
  test('GET /api/messages/channels/:channelId returns messages for a seeded channel', async () => {
    const res = await request
      .get('/api/messages/channels/c1')
      .set('Authorization', `Bearer ${getToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.messages.length).toBeGreaterThanOrEqual(10);
  });

  test('GET /api/messages/dm/:dmId returns messages for a seeded DM', async () => {
    const res = await request
      .get('/api/messages/dm/dm1')
      .set('Authorization', `Bearer ${getToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.messages.length).toBeGreaterThanOrEqual(3);
  });

  let newMsgId;

  test('POST /api/messages creates a message in a channel', async () => {
    const res = await request
      .post('/api/messages')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ content: 'Automated test message', channelId: 'c1' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    newMsgId = res.body.data.message.id;
    expect(newMsgId).toBeDefined();
  });

  test('PUT /api/messages/:messageId edits the message', async () => {
    if (!newMsgId) return;
    const res = await request
      .put(`/api/messages/${newMsgId}`)
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ content: 'Edited test message' });

    expect(res.status).toBe(200);
    expect(res.body.data.message.content).toBe('Edited test message');
  });

  test('POST /api/messages/:messageId/reactions/toggle adds a reaction', async () => {
    if (!newMsgId) return;
    const res = await request
      .post(`/api/messages/${newMsgId}/reactions/toggle`)
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ emoji: '👍' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('DELETE /api/messages/:messageId deletes the message', async () => {
    if (!newMsgId) return;
    const res = await request
      .delete(`/api/messages/${newMsgId}`)
      .set('Authorization', `Bearer ${getToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// Smaller integration/validation checks originally in message.mutation.test.js
describe('Messages — route validation and basic reachability', () => {
  test('basic channel route is reachable', async () => {
    const res = await request
      .get('/api/messages/channels/c1')
      .set('Authorization', `Bearer ${getToken()}`);
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) expect(res.body.success).toBe(true);
  });

  test('channel vs dm branch and POST validation', async () => {
    const token = getToken();

    const resChannel = await request
      .get('/api/messages/channels/c1')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 404]).toContain(resChannel.status);

    const resDm = await request
      .get('/api/messages/dm/dm1')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 404]).toContain(resDm.status);

    const resNone = await request
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'missing destination' });
    expect([400, 422]).toContain(resNone.status);
  });


  test('message content validation (empty vs valid)', async () => {
    const token = getToken();

    const bad = await request
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '', channelId: 'c1' });
    expect([400, 422]).toContain(bad.status);

    const ok = await request
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'hello mutation test', channelId: 'c1' });
    expect(ok.status).toBe(201);
    expect(ok.body.success).toBe(true);
    expect(ok.body.data?.message?.id).toBeDefined();
  });
});

// Unit tests for the router in routes/message.js (mocked models)
describe('message routes (unit, mocked) — routes/message.js', () => {
  let requestSuper;

  beforeAll(() => {
    jest.resetModules();
    // setup mocks using doMock so they apply only within this module load
    const mockMessage = {
      hasAccess: jest.fn(),
      addReaction: jest.fn(),
      removeReaction: jest.fn(),
      getReactions: jest.fn(),
      findByIdWithReactions: jest.fn(),
      findByChannelId: jest.fn(),
      findByDmId: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      searchInChannel: jest.fn(),
      searchInDm: jest.fn(),
    };
    jest.doMock('../middleware/auth', () => ({
      authenticateToken: (req, res, next) => {
        req.user = { id: 'test-user' };
        return next();
      }
    }));
    jest.doMock('../models/Message', () => mockMessage);
    jest.doMock('../models/Channel', () => ({ hasAccess: jest.fn() }));

    // require app router in isolated module registry
    const express = require('express');
    const supertest = require('supertest');
    const app = express();
    app.use(express.json());
    const messageRouter = require('../routes/message');
    app.use('/api/messages', messageRouter);
    requestSuper = supertest(app);
  });

  beforeEach(() => {
    // Reset the mocked functions between tests
    const Message = require('../models/Message');
    const Channel = require('../models/Channel');
    Object.values(Message).forEach(fn => fn && fn.mockReset && fn.mockReset());
    Channel.hasAccess && Channel.hasAccess.mockReset && Channel.hasAccess.mockReset();
  });

  test('POST /api/messages/ returns 400 if no channelId or dmId', async () => {
    const res = await requestSuper.post('/api/messages/').send({ content: 'hi' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/messages/ returns 403 when channel access denied', async () => {
    const Channel = require('../models/Channel');
    Channel.hasAccess.mockResolvedValue(false);
    const res = await requestSuper
      .post('/api/messages/')
      .send({ content: 'hello', channelId: 'c1' });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/messages/channel/:channelId denies access when Channel.hasAccess false', async () => {
    const Channel = require('../models/Channel');
    Channel.hasAccess.mockResolvedValue(false);
    const res = await requestSuper.get('/api/messages/channel/c1');
    expect(res.status).toBe(403);
  });

  test('GET /api/messages/:messageId denies access when Message.hasAccess false', async () => {
    const Message = require('../models/Message');
    Message.hasAccess.mockResolvedValue(null);
    const res = await requestSuper.get('/api/messages/m1');
    expect(res.status).toBe(403);
  });

  test('POST reaction without emoji returns 400', async () => {
    const Message = require('../models/Message');
    Message.hasAccess.mockResolvedValue({ has_access: true });
    const res = await requestSuper.post('/api/messages/m1/reactions').send({});
    expect(res.status).toBe(400);
  });

  test('POST reaction success returns 201', async () => {
    const Message = require('../models/Message');
    Message.hasAccess.mockResolvedValue({ has_access: true });
    Message.addReaction.mockResolvedValue({ id: 'r1', emoji: '👍' });
    const res = await requestSuper.post('/api/messages/m1/reactions').send({ emoji: '👍' });
    expect(res.status).toBe(201);
    expect(res.body.data.reaction).toBeDefined();
  });

  test('DELETE reaction without emoji query returns 400', async () => {
    const res = await requestSuper.delete('/api/messages/m1/reactions');
    expect(res.status).toBe(400);
  });

  test('DELETE reaction not found returns 404', async () => {
    const Message = require('../models/Message');
    Message.removeReaction.mockResolvedValue(false);
    const res = await requestSuper.delete('/api/messages/m1/reactions').query({ emoji: '👍' });
    expect(res.status).toBe(404);
  });

  test('DELETE reaction success returns 200', async () => {
    const Message = require('../models/Message');
    Message.removeReaction.mockResolvedValue(true);
    const res = await requestSuper.delete('/api/messages/m1/reactions').query({ emoji: '👍' });
    expect(res.status).toBe(200);
  });
});

// Unit tests for the routes/messages.js router
describe('message routes (unit, mocked) — routes/messages.js', () => {
  let appRequest;

  beforeAll(() => {
    jest.resetModules();
    jest.doMock('../middleware/auth', () => ({
      authenticateToken: (req, res, next) => { req.user = { id: 'u1' }; next(); },
      optionalAuth: (req, res, next) => { req.user = null; next(); }
    }));
    jest.doMock('../models/Channel', () => ({ hasAccess: jest.fn() }));
    jest.doMock('../models/Message', () => ({
      findByChannelId: jest.fn(),
      findByDmId: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      hasAccess: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addReaction: jest.fn(),
      removeReaction: jest.fn(),
      getReactions: jest.fn(),
      searchInChannel: jest.fn(),
      searchInDm: jest.fn()
    }));
    jest.doMock('../config/database', () => ({ pool: { query: jest.fn().mockResolvedValue({ rows: [] }) } }));

    const express = require('express');
    const supertest = require('supertest');
    const app = express();
    app.use(express.json());
    const messagesRouter = require('../routes/messages');
    app.use('/api/messages', messagesRouter);
    appRequest = supertest(app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /channels/:channelId returns 403 when no access', async () => {
    const Channel = require('../models/Channel');
    Channel.hasAccess.mockResolvedValue(false);
    const res = await appRequest.get('/api/messages/channels/c1');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('POST / returns 400 when content missing', async () => {
    const res = await appRequest.post('/api/messages').send({ channelId: 'c1', content: ' ' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST / returns 403 when sending to channel without access', async () => {
    const Channel = require('../models/Channel');
    Channel.hasAccess.mockResolvedValue(false);
    const res = await appRequest.post('/api/messages').send({ channelId: 'c1', content: 'hello' });
    expect(res.status).toBe(403);
  });

  test('PUT /:messageId returns 404 when Message.hasAccess returns null', async () => {
    const Message = require('../models/Message');
    Message.hasAccess.mockResolvedValue(null);
    const res = await appRequest.put('/api/messages/m1').send({ content: 'updated' });
    expect(res.status).toBe(404);
  });

  test('PUT /:messageId returns 403 when has_access false', async () => {
    const Message = require('../models/Message');
    Message.hasAccess.mockResolvedValue({ has_access: false });
    const res = await appRequest.put('/api/messages/m1').send({ content: 'updated' });
    expect(res.status).toBe(403);
  });

  test('POST toggle reaction removes existing reaction when add throws already reacted', async () => {
    const Message = require('../models/Message');
    Message.hasAccess.mockResolvedValue({ has_access: true });
    Message.addReaction.mockImplementation(() => { throw new Error('Already reacted'); });
    Message.removeReaction.mockResolvedValue(true);
    Message.getReactions.mockResolvedValue([{ emoji: '👍', users: [{ id: 'u1' }] }]);

    const res = await appRequest.post('/api/messages/m1/reactions/toggle').send({ emoji: '👍' });
    expect(res.status).toBe(200);
    expect(res.body.data.added).toBe(false);
    expect(res.body.data.reactions).toEqual([{ emoji: '👍', users: ['u1'] }]);
  });

  test('GET /channels/:channelId returns messages with reactions when access true', async () => {
    const Channel = require('../models/Channel');
    const Message = require('../models/Message');
    const { pool } = require('../config/database');

    Channel.hasAccess.mockResolvedValue(true);
    Message.findByChannelId.mockResolvedValue([{ id: 'm1', content: 'hello' }]);
    pool.query.mockResolvedValueOnce({ rows: [{ message_id: 'm1', emoji: '👍', user_id: 'u1', username: 'u1', display_name: 'User One', avatar: null }] });

    const res = await appRequest.get('/api/messages/channels/c1');
    expect(res.status).toBe(200);
    expect(res.body.data.messages[0].id).toBe('m1');
    expect(res.body.data.messages[0].reactions).toEqual([{ emoji: '👍', users: ['u1'] }]);
  });

  test('GET /dm/:dmId returns messages with reactions when access true', async () => {
    const Message = require('../models/Message');
    const { pool } = require('../config/database');

    // dm access check
    pool.query.mockResolvedValueOnce({ rowCount: 1 });
    Message.findByDmId.mockResolvedValue([{ id: 'm1', content: 'one' }, { id: 'm2', content: 'two' }]);

    // reactions rows for both messages
    pool.query.mockResolvedValueOnce({ rows: [
      { message_id: 'm1', emoji: '👍', user_id: 'u1', username: 'u1', display_name: 'U1', avatar: null },
      { message_id: 'm2', emoji: '😂', user_id: 'u2', username: 'u2', display_name: 'U2', avatar: null },
      { message_id: 'm2', emoji: '😂', user_id: 'u3', username: 'u3', display_name: 'U3', avatar: null }
    ]});

    const res = await appRequest.get('/api/messages/dm/dm1');
    expect(res.status).toBe(200);
    expect(res.body.data.messages.length).toBe(2);
    const m1 = res.body.data.messages.find(m => m.id === 'm1');
    const m2 = res.body.data.messages.find(m => m.id === 'm2');
    expect(m1.reactions).toEqual([{ emoji: '👍', users: ['u1'] }]);
    expect(m2.reactions).toEqual([{ emoji: '😂', users: ['u2', 'u3'] }]);
  });

  test('GET /channels/:channelId accepts valid before timestamp', async () => {
    const Channel = require('../models/Channel');
    const Message = require('../models/Message');
    const { pool } = require('../config/database');

    Channel.hasAccess.mockResolvedValue(true);
    Message.findByChannelId.mockResolvedValue([{ id: 'm1', content: 'hi' }]);
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await appRequest.get('/api/messages/channels/c1?before=2023-01-01T00:00:00Z');
    expect(res.status).toBe(200);
    expect(res.body.data.messages[0].id).toBe('m1');
  });

  test('POST / creates message successfully for channel', async () => {
    const Channel = require('../models/Channel');
    const Message = require('../models/Message');

    Channel.hasAccess.mockResolvedValue(true);
    Message.create.mockResolvedValue({ id: 'm-create-1' });
    Message.findById.mockResolvedValue({ id: 'm-create-1', content: 'hello', authorId: 'u1' });

    const res = await appRequest.post('/api/messages').send({ channelId: 'c1', content: '  hello  ' });
    expect(res.status).toBe(201);
    expect(Message.create).toHaveBeenCalled();
    expect(Message.create.mock.calls[0][0].content).toBe('hello');
    expect(res.body.data.message.id).toBe('m-create-1');
  });

  test('PUT /:messageId edits message successfully', async () => {
    const Message = require('../models/Message');
    Message.hasAccess.mockResolvedValue({ has_access: true });
    Message.update.mockResolvedValue(true);
    Message.findById.mockResolvedValue({ id: 'm1', content: 'updated' });

    const res = await appRequest.put('/api/messages/m1').send({ content: ' updated ' });
    expect(res.status).toBe(200);
    expect(Message.update).toHaveBeenCalledWith('m1', 'updated');
    expect(res.body.data.message.id).toBe('m1');
  });

  test('DELETE /:messageId deletes message successfully', async () => {
    const Message = require('../models/Message');
    Message.hasAccess.mockResolvedValue({ has_access: true });
    Message.delete.mockResolvedValue(true);

    const res = await appRequest.delete('/api/messages/m1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /search/channel/:channelId returns 200 when access and query present', async () => {
    const Channel = require('../models/Channel');
    const Message = require('../models/Message');
    const { pool } = require('../config/database');

    Channel.hasAccess.mockResolvedValue(true);
    Message.searchInChannel.mockResolvedValue([{ id: 's1', content: 'match' }]);
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await appRequest.get('/api/messages/search/channel/c1?q=match');
    expect(res.status).toBe(200);
    expect(res.body.data.messages.length).toBe(1);
  });

  test('GET /search/channel/:channelId returns 400 when q missing', async () => {
    const res = await appRequest.get('/api/messages/search/channel/c1');
    expect(res.status).toBe(400);
  });

  test('GET /search/channel/:channelId returns 403 when no access', async () => {
    const Channel = require('../models/Channel');
    Channel.hasAccess.mockResolvedValue(false);
    const res = await appRequest.get('/api/messages/search/channel/c1?q=test');
    expect(res.status).toBe(403);
  });

  test('GET /search/dm/:dmId returns 400 when q missing', async () => {
    const res = await appRequest.get('/api/messages/search/dm/dm1');
    expect(res.status).toBe(400);
  });

  test('GET /search/dm/:dmId returns 403 when not a participant', async () => {
    const { pool } = require('../config/database');
    pool.query.mockResolvedValueOnce({ rowCount: 0 });
    const res = await appRequest.get('/api/messages/search/dm/dm1?q=hello');
    expect(res.status).toBe(403);
  });

  test('GET /:messageId/reactions returns 404 when Message.hasAccess returns null', async () => {
    const Message = require('../models/Message');
    Message.hasAccess.mockResolvedValue(null);
    const res = await appRequest.get('/api/messages/m1/reactions');
    expect(res.status).toBe(404);
  });

  test('GET /:messageId/reactions returns 403 when has_access false', async () => {
    const Message = require('../models/Message');
    Message.hasAccess.mockResolvedValue({ has_access: false });
    const res = await appRequest.get('/api/messages/m1/reactions');
    expect(res.status).toBe(403);
  });

  test('POST toggle reaction returns 400 for invalid emoji', async () => {
    const Message = require('../models/Message');
    Message.hasAccess.mockResolvedValue({ has_access: true });
    const res = await appRequest.post('/api/messages/m1/reactions/toggle').send({ emoji: '' });
    expect(res.status).toBe(400);
  });

  test('POST toggle reaction returns 400 when addReaction throws unexpected error', async () => {
    const Message = require('../models/Message');
    Message.hasAccess.mockResolvedValue({ has_access: true });
    Message.addReaction.mockImplementation(() => { throw new Error('DB failure'); });
    const res = await appRequest.post('/api/messages/m1/reactions/toggle').send({ emoji: '😊' });
    expect(res.status).toBe(400);
  });

  test('GET /:messageId returns 200 with message and mapped reactions', async () => {
    const Message = require('../models/Message');
    Message.hasAccess.mockResolvedValue({ has_access: true });
    Message.findById.mockResolvedValue({ id: 'm1', content: 'hello', authorId: 'u1' });
    Message.getReactions.mockResolvedValue([{ emoji: '👍', users: [{ id: 'u1' }] }]);

    const res = await appRequest.get('/api/messages/m1');
    expect(res.status).toBe(200);
    expect(res.body.data.message.id).toBe('m1');
    expect(res.body.data.message.reactions).toEqual([{ emoji: '👍', users: ['u1'] }]);
  });

  test('GET /channels/:channelId returns empty messages when none present', async () => {
    const Channel = require('../models/Channel');
    const Message = require('../models/Message');
    Channel.hasAccess.mockResolvedValue(true);
    Message.findByChannelId.mockResolvedValue([]);

    const res = await appRequest.get('/api/messages/channels/c1');
    expect(res.status).toBe(200);
    expect(res.body.data.messages).toEqual([]);
  });

  test('POST / returns 400 when both channelId and dmId provided', async () => {
    const Channel = require('../models/Channel');
    Channel.hasAccess.mockResolvedValue(true);
    const res = await appRequest.post('/api/messages').send({ channelId: 'c1', dmId: 'dm1', content: 'hi' });
    expect(res.status).toBe(400);
  });
});
