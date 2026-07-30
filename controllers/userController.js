const User = require("../models/User");
const Order = require("../models/Order");
const Review = require("../models/Review");
// Decrypts an address object's fields for API responses. Falls back to the
// raw value if decryption fails (e.g. legacy unencrypted data).
function decryptAddress(address) {
  if (!address) return address;
  const safe = (val) => {
    if (!val) return val;
    try {
      return decrypt(val);
    } catch {
      return val; // legacy plaintext, or empty — return as-is
    }
  };
  return {
    street: safe(address.street),
    city: safe(address.city),
    phone: safe(address.phone),
  };
}

const bcrypt = require("bcryptjs");
const { encrypt, decrypt } = require("../utils/encryption");
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
        address: decryptAddress(user.address),
      },
    });
  } catch (error) {
    console.error("getProfile error:", error.message);
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
  }
};
// PUT /api/user/update
exports.updateProfile = async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword, address } = req.body;
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
    // Only touch address fields the user actually sent
    if (address) {
      const existingDecrypted = decryptAddress(user.address) || {};
      user.address = {
        street: encrypt(address.street ?? existingDecrypted.street ?? ""),
        city: encrypt(address.city ?? existingDecrypted.city ?? ""),
        phone: encrypt(address.phone ?? existingDecrypted.phone ?? ""),
      };
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

      // Reuse prevention — block reusing the current password or any of the last 5
      const isSameAsCurrent = await bcrypt.compare(newPassword, user.password);
      if (isSameAsCurrent) {
        return res.status(400).json({
          success: false,
          message: "New password must be different from your current password",
        });
      }
      for (const oldHash of user.passwordHistory || []) {
        const reused = await bcrypt.compare(newPassword, oldHash);
        if (reused) {
          return res.status(400).json({
            success: false,
            message: "You cannot reuse a recent password. Please choose a different one.",
          });
        }
      }

      // Push current hash into history (keep last 5) before overwriting
      user.passwordHistory = [user.password, ...(user.passwordHistory || [])].slice(0, 5);
      // Set plain text here — the model's pre-save hook will hash it on save
      user.password = newPassword;
      user.passwordChangedAt = new Date();
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
        address: decryptAddress(user.address),
      },
    });
  } catch (error) {
    console.error("updateProfile error:", error.message);
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
  }
};

// GET /api/user/export-data — protected. Lets a user download all their
// personal data as a single JSON file (profile, orders, reviews, wishlist,
// cart, address). Supports the "right to data portability" — a standard
// privacy requirement (e.g. GDPR Article 20).
exports.exportUserData = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password -passwordHistory -mfaSecret");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const orders = await Order.find({ userId: req.userId });
    const reviews = await Review.find({ userId: req.userId });

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        address: decryptAddress(user.address),
        createdAt: user.createdAt,
      },
      wishlist: user.wishlist,
      cart: user.cart,
      orders,
      reviews,
    };

    res.setHeader("Content-Disposition", `attachment; filename="my-data-export.json"`);
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error("exportUserData error:", error.message);
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
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
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
  }
};
