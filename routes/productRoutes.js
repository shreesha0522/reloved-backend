const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getAllProducts,
  getProductById,
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

// Public routes
router.get("/", getAllProducts);
router.get("/seller/mine", protect, getMyProducts);
router.get("/:id", getProductById);

// Seller-only routes
router.post("/", protect, createProduct);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);

module.exports = router;