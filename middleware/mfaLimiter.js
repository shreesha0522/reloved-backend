const rateLimit = require("express-rate-limit");

// Limits by IP: 5 MFA code attempts per 15 minutes.
// A TOTP code is only 6 digits (1,000,000 possibilities), so without a strict
// limiter here it could be brute-forced far faster than a password.
const mfaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification attempts. Please try again in 15 minutes.",
  },
});

module.exports = mfaLimiter;
