const mongoose = require("mongoose");
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    subcategory: { type: String },
    image: { type: String },
    description: { type: String, default: "" },
    stock: { type: Number, default: 10 },
    condition: {
  type: String,
  enum: ["Like New", "Good", "Fair"],
  default: "Good",
},
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Product", productSchema);