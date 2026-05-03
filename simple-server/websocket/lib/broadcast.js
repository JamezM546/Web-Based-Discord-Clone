const createBroadcastService = ({ store, sendToConnection, onDeliveryFailure }) => {
  const broadcastToRoom = async (roomId, payload, options = {}) => {
    const members = store.getRoomMembers(roomId);
    const excludedConnectionId = options.excludeConnectionId || null;

    await Promise.all(
      members.map(async (member) => {
        if (!member?.connectionId || member.connectionId === excludedConnectionId) {
          return;
        }

        try {
          await sendToConnection(member.connectionId, payload);
        } catch (error) {
          if (onDeliveryFailure) {
            await onDeliveryFailure(member.connectionId, error);
          }
        }
      })
    );
  };

  return {
    broadcastToRoom,
  };
};

module.exports = {
  createBroadcastService,
};
