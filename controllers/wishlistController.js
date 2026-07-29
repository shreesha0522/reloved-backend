const User = require("../models/User");
const Product = require("../models/Product");

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
// DELETE /api/wishlist/:id
exports.removeFromWishlist = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.wishlist) {
      user.wishlist = [];
    }

    const index = user.wishlist.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Item not found in wishlist" });
    }

    user.wishlist.splice(index, 1);
    await user.save();

    res.status(200).json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    console.error("removeFromWishlist error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// POST /api/wishlist/toggle
exports.toggleWishlistItem = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: "Product id is required" });
    }

    // Never trust name/price/image/category from the client — look up the real product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
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
      user.wishlist.push({
        id: product._id.toString(),
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
      });
      added = true;
    }

    await user.save();
    res.status(200).json({ success: true, added, wishlist: user.wishlist });
  } catch (error) {
    console.error("toggleWishlistItem error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};