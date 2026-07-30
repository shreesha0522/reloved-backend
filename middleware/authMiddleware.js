const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role; // make sure your JWT includes role when signing
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.userRole === "admin") {
    return next();
  }
  return res.status(403).json({ success: false, message: "Forbidden: Admins only" });
};

const sellerOnly = (req, res, next) => {
  if (req.userRole === "seller") {
    return next();
  }
  return res.status(403).json({ success: false, message: "Forbidden: Sellers only" });
};

module.exports = { protect, adminOnly, sellerOnly };
