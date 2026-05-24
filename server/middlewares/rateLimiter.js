const rateLimit = require('express-rate-limit');

/**
 * Global API rate limiter to prevent spam requests
 */
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again after 15 minutes.'
  }
});

/**
 * Strict limiter for sensitive authentication routes
 */
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit login attempts to 15 per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes to prevent brute-force attacks.'
  }
});

/**
 * Strict booking limiter to prevent spam order submissions
 */
exports.bookingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit booking submissions to 5 per 10 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'We have noticed rapid booking requests from your address. Please wait a few minutes before submitting new orders to prevent duplicate billing.'
  }
});
