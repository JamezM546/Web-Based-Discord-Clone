module.exports = async ({ connectionId, runtime }) => {
  runtime.store.registerConnection(connectionId);
  return {
    type: 'connectionReady',
    data: {
      connectionId,
    },
  };
};
