const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");
const {
  getPendingProducts,
  approveProduct,
  rejectProduct,
} = require("../controllers/adminController");

router.get("/pending", protect, adminOnly, getPendingProducts);
router.put("/:id/approve", protect, adminOnly, approveProduct);
router.put("/:id/reject", protect, adminOnly, rejectProduct);

module.exports = router;