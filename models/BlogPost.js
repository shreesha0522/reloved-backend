const mongoose = require("mongoose");

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String, required: true },
  author: { type: String, default: "ReLoved Team" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BlogPost", blogPostSchema);