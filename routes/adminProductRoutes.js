const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
  getPendingProducts,
  approveProduct,
  rejectProduct,
} = require("../controllers/adminController");

router.get("/pending", protect, adminOnly, getPendingProducts);
router.put("/:id/approve", protect, adminOnly, approveProduct);
router.put("/:id/reject", protect, adminOnly, rejectProduct);

module.exports = router;
