const User = require("../models/User");
const bcrypt = require("bcryptjs");

// GET /api/user/me
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

   res.status(200).json({
  success: true,
  data: {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    sellerRequestStatus: user.sellerRequestStatus,
  },
});
  } catch (error) {
    console.error("getProfile error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/user/update
exports.updateProfile = async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // If changing email, make sure it's not already taken by someone else
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
      user.email = email;
    }

    if (username) {
      user.username = username;
    }

    // Only touch password if the user is actually trying to change it
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required to set a new password",
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Current password is incorrect" });
      }

      // Set plain text here — the model's pre-save hook will hash it on save
      user.password = newPassword;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("updateProfile error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
// POST /api/user/request-seller
exports.requestSeller = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "seller" || user.role === "admin") {
      return res.status(400).json({ success: false, message: "You already have seller access" });
    }

    if (user.sellerRequestStatus === "pending") {
      return res.status(400).json({ success: false, message: "You already have a pending request" });
    }

    user.sellerRequestStatus = "pending";
    await user.save();

    res.status(200).json({
      success: true,
      message: "Your request to become a seller has been submitted",
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        sellerRequestStatus: user.sellerRequestStatus,
      },
    });
  } catch (error) {
    console.error("requestSeller error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};