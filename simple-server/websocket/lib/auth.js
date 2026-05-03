const jwt = require('jsonwebtoken');

const verifyRealtimeToken = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Authentication token is required');
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  verifyRealtimeToken,
};
