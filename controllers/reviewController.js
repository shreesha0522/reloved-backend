const Review = require("../models/Review");
const Product = require("../models/Product");
const User = require("../models/User");

// Helper — recalculate and save a product's average rating + review count
async function recalculateProductRating(productId) {
  const reviews = await Review.find({ productId });
  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;

  await Product.findByIdAndUpdate(productId, {
    rating: avgRating,
    reviews: reviewCount,
  });
}

// GET /api/reviews/:productId — all reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error("getProductReviews error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/reviews/:productId — submit a review (logged-in users only)
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { productId } = req.params;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: "Comment is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const existing = await Review.findOne({ productId, userId: req.userId });
    if (existing) {
      return res.status(400).json({ success: false, message: "You've already reviewed this product" });
    }

    const review = await Review.create({
      productId,
      userId: req.userId,
      username: user.username,
      rating,
      comment: comment.trim(),
    });

    await recalculateProductRating(productId);

    res.status(201).json({ success: true, review });
  } catch (error) {
    console.error("createReview error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/reviews/:reviewId — a user can delete their own review
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.reviewId, userId: req.userId });
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const productId = review.productId;
    await review.deleteOne();
    await recalculateProductRating(productId);

    res.status(200).json({ success: true, message: "Review deleted" });
  } catch (error) {
    console.error("deleteReview error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};