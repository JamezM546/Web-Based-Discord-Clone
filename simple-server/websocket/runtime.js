const { createInMemoryRealtimeStore } = require('./lib/connections');
const { createBroadcastService } = require('./lib/broadcast');
const { getActionHandler, getRouteHandler } = require('./lib/routes');
const { createUserRoomId, getMessageScope } = require('./lib/rooms');

const createRealtimeRuntime = ({ store, sendToConnection }) => {
  const realtimeStore = store || createInMemoryRealtimeStore();
  const broadcaster = createBroadcastService({
    store: realtimeStore,
    sendToConnection,
    onDeliveryFailure: async (connectionId) => {
      realtimeStore.removeConnection(connectionId);
    },
  });

  const sendEventToConnection = async (connectionId, payload) => {
    await sendToConnection(connectionId, payload);
  };

  const requireAuthenticatedConnection = (connectionId) => {
    const connection = realtimeStore.getConnection(connectionId);
    if (!connection?.authenticated || !connection.userId) {
      throw new Error('Authentication required');
    }
    return connection;
  };

  const dispatchAction = async ({ connectionId, message }) => {
    const action = message?.action;
    const handler = getActionHandler(action);
    const response = await handler({
      connectionId,
      data: message?.data,
      runtime,
    });

    if (response) {
      await sendEventToConnection(connectionId, response);
    }
  };

  const dispatchRoute = async ({ routeKey, connectionId, data }) => {
    const handler = getRouteHandler(routeKey);
    const response = await handler({
      connectionId,
      data,
      runtime,
    });

    if (response) {
      await sendEventToConnection(connectionId, response);
    }
  };

  const publishRoomEvent = async (roomId, payload) => {
    if (!roomId) return;
    await broadcaster.broadcastToRoom(roomId, payload);
  };

  const publishUserEvent = async (userId, payload) => {
    if (!userId) return;
    await publishRoomEvent(createUserRoomId(userId), payload);
  };

  const publishMessageCreated = async (message) => {
    const scope = getMessageScope(message);
    await publishRoomEvent(scope.roomId, {
      type: 'messageCreated',
      data: {
        message,
        ...scope,
      },
    });

    if (message.dm_id && Array.isArray(message.participants)) {
      await Promise.all(
        message.participants.map((userId) =>
          publishRoomEvent(createUserRoomId(userId), {
            type: 'messageCreated',
            data: {
              message,
              ...scope,
            },
          })
        )
      );
    }
  };

  const publishMessageUpdated = async (message) => {
    const scope = getMessageScope(message);
    await publishRoomEvent(scope.roomId, {
      type: 'messageUpdated',
      data: {
        message,
        ...scope,
      },
    });
  };

  const publishMessageDeleted = async (message) => {
    const scope = getMessageScope(message);
    await publishRoomEvent(scope.roomId, {
      type: 'messageDeleted',
      data: {
        messageId: message.id,
        ...scope,
      },
    });
  };

  const publishReactionToggled = async ({ message, reactions, added, emoji, userId }) => {
    const scope = getMessageScope(message);
    await publishRoomEvent(scope.roomId, {
      type: 'reactionToggled',
      data: {
        messageId: message.id,
        reactions,
        added,
        emoji,
        userId,
        ...scope,
      },
    });
  };

  const publishUserStatusChanged = async ({ recipients, user }) => {
    await Promise.all(
      (recipients || []).map((recipientUserId) =>
        publishUserEvent(recipientUserId, {
          type: 'userStatusChanged',
          data: { user },
        })
      )
    );
  };

  const publishFriendRequestCreated = async ({ request, users }) => {
    if (!request?.to_user_id) return;

    await publishUserEvent(request.to_user_id, {
      type: 'friendRequestCreated',
      data: {
        request,
        users: users || [],
      },
    });
  };

  const publishFriendRequestAccepted = async ({ request, users }) => {
    if (!request?.from_user_id || !request?.to_user_id) return;

    await Promise.all(
      [request.from_user_id, request.to_user_id].map((userId) =>
        publishUserEvent(userId, {
          type: 'friendRequestAccepted',
          data: {
            request,
            users: users || [],
          },
        })
      )
    );
  };

  const publishServerInviteCreated = async (invite) => {
    if (!invite?.to_user_id) return;

    await publishUserEvent(invite.to_user_id, {
      type: 'serverInviteCreated',
      data: {
        invite,
      },
    });
  };

  const runtime = {
    store: realtimeStore,
    requireAuthenticatedConnection,
    broadcastToRoom: broadcaster.broadcastToRoom,
    dispatchAction,
    dispatchRoute,
    publishMessageCreated,
    publishMessageUpdated,
    publishMessageDeleted,
    publishReactionToggled,
    publishUserEvent,
    publishUserStatusChanged,
    publishFriendRequestCreated,
    publishFriendRequestAccepted,
    publishServerInviteCreated,
  };

  return runtime;
};

module.exports = {
  createRealtimeRuntime,
};
