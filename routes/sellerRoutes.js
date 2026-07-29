const express = require("express");
const router = express.Router();
const { protect, sellerOnly } = require("../middleware/authMiddleware");
const { addProduct, getSellerOrders } = require("../controllers/sellerController");

router.post("/add", protect, sellerOnly, addProduct);
router.get("/orders", protect, sellerOnly, getSellerOrders);

module.exports = router;
