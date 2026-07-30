const ActivityLog = require("../models/ActivityLog");

// Fire-and-forget — logging should never break or slow down the main request
async function logActivity(action, { userId = null, ip = null, details = {} } = {}) {
  try {
    await ActivityLog.create({ userId, action, ip, details });
  } catch (err) {
    console.error("logActivity error:", err.message);
  }
}

module.exports = logActivity;