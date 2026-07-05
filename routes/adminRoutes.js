const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");
const {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getSellerRequests,
  approveSellerRequest,
  rejectSellerRequest,
} = require("../controllers/adminController");

router.get("/", protect, adminOnly, getAllUsers);
router.get("/seller-requests", protect, adminOnly, getSellerRequests);
router.put("/seller-requests/:id/approve", protect, adminOnly, approveSellerRequest);
router.put("/seller-requests/:id/reject", protect, adminOnly, rejectSellerRequest);
router.get("/:id", protect, adminOnly, getUserById);
router.put("/:id/status", protect, adminOnly, updateUserStatus);
router.put("/:id/role", protect, adminOnly, updateUserRole);
router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;