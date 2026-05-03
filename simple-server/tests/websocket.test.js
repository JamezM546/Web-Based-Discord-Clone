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

  test('publishes a userStatusChanged event to related users', async () => {
    const receiver = await connectAuthenticatedClient(getSecondToken());
    const statusChangedPromise = waitForEvent(receiver, 'userStatusChanged');

    const res = await request
      .put('/api/users/me/status')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ status: 'idle' });

    expect(res.status).toBe(200);

    const event = await statusChangedPromise;
    expect(event.data.user.id).toBe(res.body.data.user.id);
    expect(event.data.user.status).toBe('idle');

    receiver.close();
    openSockets.delete(receiver);
  });

  test('publishes a friendRequestCreated event to the recipient user room', async () => {
    const senderName = `wsfrsend${Date.now()}`;
    const receiverName = `wsfrrecv${Date.now()}`;

    const senderRes = await request.post('/api/auth/register').send({
      username: senderName,
      email: `${senderName}@test.com`,
      password: 'pass1234',
    });
    const receiverRes = await request.post('/api/auth/register').send({
      username: receiverName,
      email: `${receiverName}@test.com`,
      password: 'pass1234',
    });

    const receiverSocket = await connectAuthenticatedClient(receiverRes.body.data.token);
    const friendRequestPromise = waitForEvent(receiverSocket, 'friendRequestCreated');

    const sendRes = await request
      .post('/api/friends/requests')
      .set('Authorization', `Bearer ${senderRes.body.data.token}`)
      .send({ toUserId: receiverRes.body.data.user.id });

    expect(sendRes.status).toBe(201);

    const event = await friendRequestPromise;
    expect(event.data.request.to_user_id).toBe(receiverRes.body.data.user.id);
    expect(event.data.request.from_user_id).toBe(senderRes.body.data.user.id);
    expect(Array.isArray(event.data.users)).toBe(true);
    expect(event.data.users.some((user) => user.id === senderRes.body.data.user.id)).toBe(true);

    receiverSocket.close();
    openSockets.delete(receiverSocket);
  });

  test('publishes a friendRequestAccepted event to the original sender user room', async () => {
    const senderName = `wsfraccsend${Date.now()}`;
    const receiverName = `wsfraccrecv${Date.now()}`;

    const senderRes = await request.post('/api/auth/register').send({
      username: senderName,
      email: `${senderName}@test.com`,
      password: 'pass1234',
    });
    const receiverRes = await request.post('/api/auth/register').send({
      username: receiverName,
      email: `${receiverName}@test.com`,
      password: 'pass1234',
    });

    const senderSocket = await connectAuthenticatedClient(senderRes.body.data.token);
    const acceptedPromise = waitForEvent(senderSocket, 'friendRequestAccepted');

    const sendRes = await request
      .post('/api/friends/requests')
      .set('Authorization', `Bearer ${senderRes.body.data.token}`)
      .send({ toUserId: receiverRes.body.data.user.id });

    expect(sendRes.status).toBe(201);

    const acceptRes = await request
      .post(`/api/friends/requests/${sendRes.body.data.request.id}/accept`)
      .set('Authorization', `Bearer ${receiverRes.body.data.token}`);

    expect(acceptRes.status).toBe(200);

    const event = await acceptedPromise;
    expect(event.data.request.id).toBe(sendRes.body.data.request.id);
    expect(event.data.request.status).toBe('accepted');
    expect(event.data.users.some((user) => user.id === receiverRes.body.data.user.id)).toBe(true);

    senderSocket.close();
    openSockets.delete(senderSocket);
  });

  test('publishes a friendRemoved event to both users when one removes the other', async () => {
    const removerName = `wsfrremsend${Date.now()}`;
    const removedName = `wsfrremrecv${Date.now()}`;

    const removerRes = await request.post('/api/auth/register').send({
      username: removerName,
      email: `${removerName}@test.com`,
      password: 'pass1234',
    });
    const removedRes = await request.post('/api/auth/register').send({
      username: removedName,
      email: `${removedName}@test.com`,
      password: 'pass1234',
    });

    const sendRes = await request
      .post('/api/friends/requests')
      .set('Authorization', `Bearer ${removerRes.body.data.token}`)
      .send({ toUserId: removedRes.body.data.user.id });

    expect(sendRes.status).toBe(201);

    const acceptRes = await request
      .post(`/api/friends/requests/${sendRes.body.data.request.id}/accept`)
      .set('Authorization', `Bearer ${removedRes.body.data.token}`);

    expect(acceptRes.status).toBe(200);

    const removerSocket = await connectAuthenticatedClient(removerRes.body.data.token);
    const removedSocket = await connectAuthenticatedClient(removedRes.body.data.token);
    const removerEventPromise = waitForEvent(removerSocket, 'friendRemoved');
    const removedEventPromise = waitForEvent(removedSocket, 'friendRemoved');

    const deleteRes = await request
      .delete(`/api/friends/${removedRes.body.data.user.id}`)
      .set('Authorization', `Bearer ${removerRes.body.data.token}`);

    expect(deleteRes.status).toBe(200);

    const [removerEvent, removedEvent] = await Promise.all([removerEventPromise, removedEventPromise]);
    expect(removerEvent.data.userIds).toEqual(
      expect.arrayContaining([removerRes.body.data.user.id, removedRes.body.data.user.id])
    );
    expect(removedEvent.data.userIds).toEqual(
      expect.arrayContaining([removerRes.body.data.user.id, removedRes.body.data.user.id])
    );

    removerSocket.close();
    removedSocket.close();
    openSockets.delete(removerSocket);
    openSockets.delete(removedSocket);
  });

  test('publishes serverChannelsUpdated to the server room when channels change', async () => {
    const receiver = await connectRealtimeClient(getToken(), 'server:s1');
    const channelCreatedPromise = waitForEvent(receiver, 'serverChannelsUpdated');

    const createRes = await request
      .post('/api/channels')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ name: `ws-room-${Date.now()}`, serverId: 's1' });

    expect(createRes.status).toBe(201);

    const createdEvent = await channelCreatedPromise;
    expect(createdEvent.data.serverId).toBe('s1');
    expect(createdEvent.data.channels.some((channel) => channel.id === createRes.body.data.channel.id)).toBe(true);

    const updatedPromise = waitForEvent(receiver, 'serverChannelsUpdated');
    const updateRes = await request
      .put(`/api/channels/${createRes.body.data.channel.id}`)
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ name: 'renamed-room' });

    expect(updateRes.status).toBe(200);

    const updatedEvent = await updatedPromise;
    expect(updatedEvent.data.channels.some((channel) => channel.name === 'renamed-room')).toBe(true);

    const deletedPromise = waitForEvent(receiver, 'serverChannelsUpdated');
    const deleteRes = await request
      .delete(`/api/channels/${createRes.body.data.channel.id}`)
      .set('Authorization', `Bearer ${getToken()}`);

    expect(deleteRes.status).toBe(200);

    const deletedEvent = await deletedPromise;
    expect(deletedEvent.data.channels.some((channel) => channel.id === createRes.body.data.channel.id)).toBe(false);

    receiver.close();
    openSockets.delete(receiver);
  });

  test('publishes invite message and invite metadata to the recipient user room', async () => {
    const inviteeName = `wsinvite${Date.now()}`;
    const inviteeRes = await request.post('/api/auth/register').send({
      username: inviteeName,
      email: `${inviteeName}@test.com`,
      password: 'pass1234',
    });

    const inviteeSocket = await connectAuthenticatedClient(inviteeRes.body.data.token);
    const messagePromise = waitForEvent(inviteeSocket, 'messageCreated');
    const invitePromise = waitForEvent(inviteeSocket, 'serverInviteCreated');

    const res = await request
      .post('/api/invites')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ serverId: 's1', toUserId: inviteeRes.body.data.user.id });

    expect(res.status).toBe(201);

    const [messageEvent, inviteEvent] = await Promise.all([messagePromise, invitePromise]);
    expect(messageEvent.data.message.server_invite_id || messageEvent.data.message.serverInviteId).toBe(res.body.data.invite.id);
    expect(inviteEvent.data.invite.id).toBe(res.body.data.invite.id);
    expect(inviteEvent.data.invite.to_user_id).toBe(inviteeRes.body.data.user.id);

    inviteeSocket.close();
    openSockets.delete(inviteeSocket);
  });

});
