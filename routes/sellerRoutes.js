const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const sellerOnly = require("../middleware/sellerOnly");
const { getSellerOrders } = require("../controllers/sellerController");

router.get("/orders", protect, sellerOnly, getSellerOrders);

module.exports = router;