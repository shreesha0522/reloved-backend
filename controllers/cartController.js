const User = require("../models/User");
const Product = require("../models/Product");

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const cart = user.cart || [];
    if (cart.length === 0) {
      return res.status(200).json({ success: true, cart: [] });
    }

    // Re-sync each cart item with the live product — fixes stale prices,
    // and drops items whose product was deleted by the seller.
    const productIds = cart.map((item) => item.id);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const syncedCart = [];
    let cartChanged = false;

    for (const item of cart) {
      const product = productMap.get(item.id);
      if (!product) {
        // Product was deleted — drop it from the cart
        cartChanged = true;
        continue;
      }

      const cappedQty = Math.min(item.qty, product.stock || 0);

      if (
        product.price !== item.price ||
        product.name !== item.name ||
        product.image !== item.image ||
        cappedQty !== item.qty
      ) {
        cartChanged = true;
      }

      if (cappedQty > 0) {
        syncedCart.push({
          id: item.id,
          name: product.name,
          price: product.price,
          image: product.image,
          qty: cappedQty,
          sellerId: product.sellerId,
        });
      } else {
        cartChanged = true; // out of stock now — dropped entirely
      }
    }

    if (cartChanged) {
      user.cart = syncedCart;
      await user.save();
    }

    res.status(200).json({ success: true, cart: syncedCart });
  } catch (error) {
    console.error("getCart error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/cart/add
exports.addToCart = async (req, res) => {
  try {
    const { id, qty } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: "Product id is required" });
    }

    const requestedQty = Number(qty) || 1;
    if (requestedQty < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }

    // Look up the real product server-side — never trust price/name/sellerId from the client
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (!user.cart) {
      user.cart = [];
    }

    const existing = user.cart.find((item) => item.id === id);
    const currentQtyInCart = existing ? existing.qty : 0;
    const newTotalQty = currentQtyInCart + requestedQty;

    if (newTotalQty > product.stock) {
      return res.status(400).json({
        success: false,
        message:
          product.stock === 0
            ? "This product is out of stock"
            : `Only ${product.stock} left in stock. You already have ${currentQtyInCart} in your cart.`,
      });
    }

    if (existing) {
      existing.qty = newTotalQty;
    } else {
      user.cart.push({
        id: product._id.toString(),
        name: product.name,
        price: product.price,
        image: product.image,
        qty: requestedQty,
        sellerId: product.sellerId,
      });
    }

    await user.save();
    res.status(200).json({ success: true, cart: user.cart });
  } catch (error) {
    console.error("addToCart error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/cart/update
exports.updateCartQty = async (req, res) => {
  try {
    const { id, qty } = req.body;
    if (!id || qty == null) {
      return res.status(400).json({ success: false, message: "id and qty are required" });
    }

    const requestedQty = Math.max(1, Number(qty) || 1);

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const item = (user.cart || []).find((i) => i.id === id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }

    const product = await Product.findById(id);
    if (product && requestedQty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} left in stock.`,
      });
    }

    item.qty = requestedQty;
    await user.save();
    res.status(200).json({ success: true, cart: user.cart });
  } catch (error) {
    console.error("updateCartQty error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/cart/remove/:id
exports.removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.cart = (user.cart || []).filter((item) => item.id !== id);
    await user.save();
    res.status(200).json({ success: true, cart: user.cart });
  } catch (error) {
    console.error("removeFromCart error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/cart/clear
exports.clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.cart = [];
    await user.save();
    res.status(200).json({ success: true, cart: user.cart });
  } catch (error) {
    console.error("clearCart error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};