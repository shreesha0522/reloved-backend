const ActivityLog = require("../models/ActivityLog");

// GET /api/activity-logs — admin only, latest 200 events
exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("userId", "username email");
    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error("getActivityLogs error:", error.message);
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
  }
};
