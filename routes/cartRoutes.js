const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getCart,
  addToCart,
  updateCartQty,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");

router.get("/", protect, getCart);
router.post("/add", protect, addToCart);
router.put("/update", protect, updateCartQty);
router.delete("/remove/:id", protect, removeFromCart);
router.delete("/clear", protect, clearCart);

module.exports = router;