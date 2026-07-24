// routes/orders.js
const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createOrder,
  markOrderPaid,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/orderController");

router.post("/", protect, createOrder);
router.get("/", protect, getMyOrders);
router.get("/:id", protect, getOrderById);

router.put("/:id/status", protect, updateOrderStatus);

module.exports = router;