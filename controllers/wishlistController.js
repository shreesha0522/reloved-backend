const User = require("../models/User");

// GET /api/wishlist
exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, wishlist: user.wishlist || [] });
  } catch (error) {
    console.error("getWishlist error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/wishlist/toggle
exports.toggleWishlistItem = async (req, res) => {
  try {
    const { id, name, price, image, category } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: "Product id is required" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.wishlist) {
      user.wishlist = [];
    }

    const existingIndex = user.wishlist.findIndex((item) => item.id === id);
    let added;

    if (existingIndex >= 0) {
      user.wishlist.splice(existingIndex, 1);
      added = false;
    } else {
      user.wishlist.push({ id, name, price, image, category });
      added = true;
    }

    await user.save();
    res.status(200).json({ success: true, added, wishlist: user.wishlist });
  } catch (error) {
    console.error("toggleWishlistItem error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};