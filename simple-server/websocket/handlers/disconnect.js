module.exports = async ({ connectionId, runtime }) => {
  runtime.store.removeConnection(connectionId);
  return null;
};
