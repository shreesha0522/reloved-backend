const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const { getProductReviews, createReview, deleteReview } = require("../controllers/reviewController");

router.get("/:productId", getProductReviews);
router.post("/:productId", protect, createReview);
router.delete("/:reviewId", protect, deleteReview);

module.exports = router;