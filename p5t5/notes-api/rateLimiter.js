function rateLimiter(maxRequests, windowMs) {
  const requestLog = new Map(); 

  return function (req, res, next) {
    const ip = req.ip;
    const now = Date.now();
    const timestamps = (requestLog.get(ip) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      return res.status(429).json({
        error: { message: 'Too many requests, please try again later', code: 'RateLimitExceeded' },
      });
    }

    timestamps.push(now);
    requestLog.set(ip, timestamps); 
    next();
  };
}

module.exports = rateLimiter;
