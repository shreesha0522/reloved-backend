require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const cartRoutes = require("./routes/cartRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();

app.use(cors({
origin: [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://reloved-website.vercel.app",
],
credentials: true,
}));
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/products", productRoutes);
app.use("/api/user", require("./routes/user"));
app.use("/api/blog", require("./routes/blog"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/esewa", require("./routes/esewa"));
app.use("/api/seller", require("./routes/sellerRoutes"));
app.use("/api/admin/users", require("./routes/adminRoutes"));
app.use("/api/admin/products", require("./routes/adminProductRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));


app.get("/", (req, res) => {
  res.send("ReLoved API is running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});