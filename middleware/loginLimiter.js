const rateLimit = require("express-rate-limit");

// Limits by IP: 10 login attempts per 15 minutes, regardless of which account
// This stops rapid-fire automated attacks; account-level lockout (in
// authController.js) separately stops slow/distributed attacks on one account.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts from this device. Please try again in 15 minutes.",
  },
});

module.exports = loginLimiter;