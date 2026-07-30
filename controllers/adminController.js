const User = require("../models/User");
const Product = require("../models/Product");
const AuditLog = require("../models/AuditLog");
const {
  sendProductApprovedEmail,
  sendProductRejectedEmail,
  sendAccountStatusEmail,
  sendSellerRequestApprovedEmail,
  sendSellerRequestRejectedEmail,
} = require("../utils/sendEmail");

// GET /api/admin/users?search=&role=&status=&page=&limit=
const getAllUsers = async (req, res) => {
  try {
    const { search = "", role, status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) query.role = role;
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query).select("-password").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({ success: true, users, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive must be true or false" });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await AuditLog.create({
      action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      performedBy: req.userId,
      targetUser: user._id,
    });

    try {
      if (user.email) {
        await sendAccountStatusEmail(user.email, isActive);
      }
    } catch (emailError) {
      console.error("Account status email failed:", emailError.message);
    }

    res.json({ success: true, message: `User ${isActive ? "activated" : "deactivated"}`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ["user", "seller", "admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    const oldUser = await User.findById(req.params.id);
    if (!oldUser) return res.status(404).json({ success: false, message: "User not found" });

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");

    await AuditLog.create({
      action: "ROLE_UPDATED",
      performedBy: req.userId,
      targetUser: user._id,
      details: { oldRole: oldUser.role, newRole: role },
    });

    res.json({ success: true, message: "Role updated", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await AuditLog.create({
      action: "USER_DELETED",
      performedBy: req.userId,
      targetUser: user._id,
      details: { deletedEmail: user.email, deletedUsername: user.username },
    });

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
  }
};

// GET /api/admin/products/pending
const getPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: "pending" })
      .populate("sellerId", "username email")
      .sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
  }
};

// PUT /api/admin/products/:id/approve
const approveProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: "approved", rejectionReason: "" },
      { new: true }
    ).populate("sellerId", "email");
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    try {
      if (product.sellerId?.email) {
        await sendProductApprovedEmail(product.sellerId.email, product);
      }
    } catch (emailError) {
      console.error("Product approved email failed:", emailError.message);
    }

    res.json({ success: true, message: "Product approved", product });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
  }
};

// PUT /api/admin/products/:id/reject
const rejectProduct = async (req, res) => {
  try {
    const { reason = "" } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", rejectionReason: reason },
      { new: true }
    ).populate("sellerId", "email");
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    try {
      if (product.sellerId?.email) {
        await sendProductRejectedEmail(product.sellerId.email, product);
      }
    } catch (emailError) {
      console.error("Product rejected email failed:", emailError.message);
    }

    res.json({ success: true, message: "Product rejected", product });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
  }
};

// GET /api/admin/seller-requests
const getSellerRequests = async (req, res) => {
  try {
    const users = await User.find({ sellerRequestStatus: "pending" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
  }
};

// PUT /api/admin/seller-requests/:id/approve
const approveSellerRequest = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: "seller", sellerRequestStatus: "approved" },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    try {
      if (user.email) {
        await sendSellerRequestApprovedEmail(user.email);
      }
    } catch (emailError) {
      console.error("Seller approval email failed:", emailError.message);
    }

    res.json({ success: true, message: "Seller request approved", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
  }
};

// PUT /api/admin/seller-requests/:id/reject
const rejectSellerRequest = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { sellerRequestStatus: "rejected" },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    try {
      if (user.email) {
        await sendSellerRequestRejectedEmail(user.email);
      }
    } catch (emailError) {
      console.error("Seller rejection email failed:", emailError.message);
    }

    res.json({ success: true, message: "Seller request rejected", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getPendingProducts,
  approveProduct,
  rejectProduct,
  getSellerRequests,
  approveSellerRequest,
  rejectSellerRequest,
};