const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getWishlist, toggleWishlistItem } = require("../controllers/wishlistController");

router.get("/", protect, getWishlist);
router.post("/toggle", protect, toggleWishlistItem);

module.exports = router;