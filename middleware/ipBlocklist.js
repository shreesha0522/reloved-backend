// In-memory tracker of failed login attempts per IP, independent of which
// account was targeted. This catches attackers trying many different
// usernames/passwords from one machine — something per-account lockout
// (in User.js) can't see, since it only tracks attempts against one account.

// Wider window than the per-burst rate limiter (which already stops fast
// attacks). This specifically catches an attacker slowly trying many
// different accounts from one IP over hours — a pattern the rate limiter's
// short 15-minute window and the per-account lockout can't see on their own.
const FAILED_ATTEMPT_LIMIT = 25;   // across ALL accounts, from one IP
const ATTEMPT_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours
const BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour block

// ip -> { count, windowStart, blockedUntil }
const ipTracker = new Map();

function getClientIp(req) {
  // req.ip respects Express's "trust proxy" setting already configured in server.js
  return req.ip;
}

function isIpBlocked(req, res, next) {
  const ip = getClientIp(req);
  const record = ipTracker.get(ip);

  if (record && record.blockedUntil && record.blockedUntil > Date.now()) {
    const minutesLeft = Math.ceil((record.blockedUntil - Date.now()) / 60000);
    return res.status(423).json({
      success: false,
      message: `Too many failed login attempts from this network. Try again in ${minutesLeft} minute(s).`,
    });
  }

  next();
}

function recordFailedAttempt(req) {
  const ip = getClientIp(req);
  const now = Date.now();
  let record = ipTracker.get(ip);

  if (!record || now - record.windowStart > ATTEMPT_WINDOW_MS) {
    // Start a fresh window
    record = { count: 1, windowStart: now, blockedUntil: null };
  } else {
    record.count += 1;
  }

  if (record.count >= FAILED_ATTEMPT_LIMIT) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
  }

  ipTracker.set(ip, record);
}

function clearFailedAttempts(req) {
  const ip = getClientIp(req);
  ipTracker.delete(ip);
}

module.exports = { isIpBlocked, recordFailedAttempt, clearFailedAttempts };
