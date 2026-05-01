const buckets = new Map();

const createRateLimiter = ({ windowMs, max }) => {
  return (req, res, next) => {
    const now = Date.now();
    const key = req.user && req.user.id ? `user:${req.user.id}` : `ip:${req.ip}`;

    let bucket = buckets.get(key);
    if (!bucket || now - bucket.start > windowMs) {
      bucket = { start: now, count: 0 };
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > max) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded for this operation. Please try again later.'
      });
    }

    next();
  };
};

module.exports = {
  createRateLimiter
};

