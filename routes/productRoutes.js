const express = require("express");
const router = express.Router();

const { protect, sellerOnly } = require("../middleware/authMiddleware");

const {
  createProduct,
  getAllProducts,
  getProductById,
  getMyProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Seller routes
router.get("/seller/mine", protect, sellerOnly, getMyProducts);
router.post("/add", protect, sellerOnly, createProduct);
router.put("/:id", protect, sellerOnly, updateProduct);
router.delete("/:id", protect, sellerOnly, deleteProduct);

module.exports = router;