const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true },
    // e.g. "LOGIN_SUCCESS", "LOGIN_FAILED", "ORDER_CREATED", "PAYMENT_VERIFIED"
    ip: { type: String, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    // small, non-sensitive context only — e.g. { orderId } not { password }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);