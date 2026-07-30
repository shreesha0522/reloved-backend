const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { getActivityLogs } = require("../controllers/activityLogController");

router.get("/", protect, adminOnly, getActivityLogs);

module.exports = router;
