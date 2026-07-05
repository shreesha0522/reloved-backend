const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        id: String,
        name: String,
        price: Number,
        image: String,
        qty: Number,
        sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    itemTotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    total: { type: Number, required: true },
    deliveryOption: { type: String, enum: ["standard", "pickup"], required: true },
    shippingAddress: {
      name: String,
      phone: String,
      address: String,
    },
    transactionUuid: { type: String },
    paymentMethod: { type: String, enum: ["esewa", "khalti", "bank"], required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    orderStatus: {
      type: String,
      enum: ["confirmed", "packed", "ready_to_ship", "in_transit", "out_for_delivery", "delivered"],
      default: "confirmed",
    },
    orderNumber: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);