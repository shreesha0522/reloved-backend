require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const cartRoutes = require("./routes/cartRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();

// --- Security headers ---
// Sets sensible defaults (X-Content-Type-Options, X-Frame-Options, etc.)
// to reduce common attack surface (clickjacking, MIME sniffing, etc.)
app.use(helmet());

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
app.use(cookieParser());

// --- Input sanitization ---
// Strips any keys starting with "$" or containing "." from req.body/query/params,
// preventing NoSQL injection attempts like { "email": { "$ne": null } }
app.use(mongoSanitize());

// --- Global rate limiter ---
// Applies to every route as a baseline defense against abuse/DoS-style hammering.
// The login route has its own stricter limiter on top of this (see loginLimiter.js).
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // 300 requests per IP per 15 minutes across the whole API
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this device. Please try again shortly.",
  },
});
app.use(globalLimiter);

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/mfa", require("./routes/mfaRoutes"));
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

// --- Centralized error handler ---
// Catches anything that falls through unhandled, avoids leaking stack traces
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ success: false, message: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});