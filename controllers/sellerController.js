const Product = require("../models/Product");
const Order = require("../models/Order");

// GET /api/seller/orders — orders containing at least one item belonging to this seller
exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ "items.sellerId": req.userId }).sort({ createdAt: -1 });

    const filtered = orders.map((order) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      items: order.items.filter((item) => String(item.sellerId) === String(req.userId)),
    }));

    res.status(200).json({ success: true, orders: filtered });
  } catch (error) {
    console.error("getSellerOrders error:", error.message);
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
  }
};

// POST /api/seller/add — add a new product
exports.addProduct = async (req, res) => {
  try {
    const { name, price, image, category } = req.body;

    if (!name || !price) {
      return res.status(400).json({ success: false, message: "Name and price are required" });
    }

    const product = new Product({
      name,
      price,
      image,
      category,
      sellerId: req.userId, // link product to the seller
    });

    await product.save();

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error("addProduct error:", error.message);
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
  }
};
