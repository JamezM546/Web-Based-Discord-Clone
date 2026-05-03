const WebSocket = require('ws');
const { request, getToken, getSecondToken, ensureInit, cleanup } = require('./setup');
const { createHttpServer } = require('../server');

let server;
let serverAddress;
const openSockets = new Set();

const waitForEvent = (socket, expectedType) =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off('message', onMessage);
      reject(new Error(`Timed out waiting for ${expectedType}`));
    }, 5000);

    const onMessage = (raw) => {
      const payload = JSON.parse(raw.toString());
      if (payload.type === expectedType) {
        clearTimeout(timeout);
        socket.off('message', onMessage);
        resolve(payload);
      }
    };

    socket.on('message', onMessage);
  });

const connectRealtimeClient = async (token, roomId) => {
  const socket = new WebSocket(`ws://127.0.0.1:${serverAddress.port}/ws`);

  await new Promise((resolve) => socket.once('open', resolve));
  socket.send(JSON.stringify({ action: 'auth', data: { token } }));
  await waitForEvent(socket, 'authSuccess');
  socket.send(JSON.stringify({ action: 'joinRoom', data: { roomId } }));
  await waitForEvent(socket, 'roomJoined');
  openSockets.add(socket);

  return socket;
};

const connectAuthenticatedClient = async (token) => {
  const socket = new WebSocket(`ws://127.0.0.1:${serverAddress.port}/ws`);

  await new Promise((resolve) => socket.once('open', resolve));
  socket.send(JSON.stringify({ action: 'auth', data: { token } }));
  await waitForEvent(socket, 'authSuccess');
  openSockets.add(socket);

  return socket;
};

beforeAll(async () => {
  await ensureInit();
  server = createHttpServer();

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      serverAddress = server.address();
      resolve();
    });
  });
}, 30000);

afterAll(async () => {
  await Promise.all(
    Array.from(openSockets).map(
      (socket) =>
        new Promise((resolve) => {
          if (socket.readyState === WebSocket.CLOSED) {
            resolve();
            return;
          }

          socket.once('close', resolve);
          socket.close();
        })
    )
  );

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  await cleanup();
});

describe('Websocket realtime delivery', () => {
  test('publishes a channel messageCreated event to other room members', async () => {
    const receiver = await connectRealtimeClient(getSecondToken(), 'channel:c1');
    const messageCreatedPromise = waitForEvent(receiver, 'messageCreated');

    const res = await request
      .post('/api/messages')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ content: 'Realtime channel delivery', channelId: 'c1' });

    expect(res.status).toBe(201);

    const event = await messageCreatedPromise;
    expect(event.data.roomId).toBe('channel:c1');
    expect(event.data.message.content).toBe('Realtime channel delivery');

    receiver.close();
    openSockets.delete(receiver);
  });

  test('publishes a DM messageCreated event to the DM room', async () => {
    const receiver = await connectRealtimeClient(getSecondToken(), 'dm:dm1');
    const messageCreatedPromise = waitForEvent(receiver, 'messageCreated');

    const res = await request
      .post('/api/messages')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ content: 'Realtime DM delivery', dmId: 'dm1' });

    expect(res.status).toBe(201);

    const event = await messageCreatedPromise;
    expect(event.data.roomId).toBe('dm:dm1');
    expect(event.data.message.content).toBe('Realtime DM delivery');

    receiver.close();
    openSockets.delete(receiver);
  });

  test('publishes a first-message DM event to the recipient user room before they open the chat', async () => {
    const receiver = await connectAuthenticatedClient(getSecondToken());
    const messageCreatedPromise = waitForEvent(receiver, 'messageCreated');
    const recipientProfileRes = await request
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${getSecondToken()}`);

    expect(recipientProfileRes.status).toBe(200);
    const recipientUserId = recipientProfileRes.body.data.user.id;

    const createDmRes = await request
      .post('/api/direct-messages')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ userId: recipientUserId });

    expect(createDmRes.status).toBeGreaterThanOrEqual(200);
    expect(createDmRes.status).toBeLessThan(300);

    const dmId = createDmRes.body.data.directMessage.id;

    const messageRes = await request
      .post('/api/messages')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ content: 'First DM should surface in inbox', dmId });

    expect(messageRes.status).toBe(201);

    const event = await messageCreatedPromise;
    expect(event.data.dmId).toBe(dmId);
    expect(event.data.message.content).toBe('First DM should surface in inbox');

    receiver.close();
    openSockets.delete(receiver);
  });

});
