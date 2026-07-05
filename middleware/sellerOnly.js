// middleware/sellerOnly.js
const User = require("../models/User");

const sellerOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.role !== "seller" && user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Seller access required" });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = sellerOnly;