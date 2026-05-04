module.exports = async ({ connectionId, runtime }) => {
  await runtime.store.registerConnection(connectionId);
  return {
    type: 'connectionReady',
    data: {
      connectionId,
    },
  };
};
