module.exports = async ({ connectionId, runtime }) => {
  await runtime.store.removeConnection(connectionId);
  return null;
};
