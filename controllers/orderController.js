const Order = require("../models/Order");
const User = require("../models/User");
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require("../utils/sendEmail");
const logActivity = require("../utils/logActivity");

exports.createOrder = async (req, res) => {
  try {
    const { deliveryOption, shippingAddress, paymentMethod } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const itemTotal = user.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const deliveryFee = deliveryOption === "standard" ? 180 : 0;
    const total = itemTotal + deliveryFee;
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;

    const order = await Order.create({
      userId: user._id,
      items: user.cart,
      itemTotal,
      deliveryFee,
      total,
      deliveryOption,
      shippingAddress,
      paymentMethod,
      paymentStatus: "pending",
      orderStatus: "confirmed",
      orderNumber,
    });

    user.cart = [];
    await user.save();

    logActivity("ORDER_CREATED", { userId: user._id, ip: req.ip, details: { orderId: order._id, total } });

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error("createOrder error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("getMyOrders error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("getOrderById error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSellerOrders = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== "seller") {
      return res.status(403).json({ success: false, message: "Only sellers can view this" });
    }

    const orders = await Order.find({ "items.sellerId": req.userId }).sort({ createdAt: -1 });

    const filtered = orders.map((order) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      deliveryOption: order.deliveryOption,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      items: order.items.filter((item) => String(item.sellerId) === String(req.userId)),
    }));

    res.status(200).json({ success: true, orders: filtered });
  } catch (error) {
    console.error("getSellerOrders error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["confirmed", "packed", "ready_to_ship", "in_transit", "out_for_delivery", "delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }
    const user = await User.findById(req.userId);
    if (!user || user.role !== "seller") {
      return res.status(403).json({ success: false, message: "Only sellers can update order status" });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    const ownsItem = order.items.some((item) => String(item.sellerId) === String(req.userId));
    if (!ownsItem) {
      return res.status(403).json({ success: false, message: "You don't have items in this order" });
    }
    order.orderStatus = status;
    await order.save();

    logActivity("ORDER_STATUS_UPDATED", { userId: req.userId, ip: req.ip, details: { orderId: order._id, status } });

    try {
      const customer = await User.findById(order.userId);
      if (customer?.email) {
        await sendOrderStatusEmail(customer.email, order);
      }
    } catch (emailError) {
      console.error("Order status email failed:", emailError.message);
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("updateOrderStatus error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
