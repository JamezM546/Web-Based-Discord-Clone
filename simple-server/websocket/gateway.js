let realtimeRuntime = null;

const setRealtimeRuntime = (runtime) => {
  realtimeRuntime = runtime;
};

const getRealtimeRuntime = () => realtimeRuntime;

module.exports = {
  setRealtimeRuntime,
  getRealtimeRuntime,
};
