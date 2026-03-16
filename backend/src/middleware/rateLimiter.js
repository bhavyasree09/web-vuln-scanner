const rateLimit = require('express-rate-limit');

const scanRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Too many scans initiated. Please wait before starting another scan.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { scanRateLimiter, authRateLimiter };
