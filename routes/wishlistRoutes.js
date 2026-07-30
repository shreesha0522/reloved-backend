const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getWishlist, toggleWishlistItem, removeFromWishlist } = require("../controllers/wishlistController");

router.get("/", protect, getWishlist);
router.post("/toggle", protect, toggleWishlistItem);
router.delete("/:id", protect, removeFromWishlist);

module.exports = router;
