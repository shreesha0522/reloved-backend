const express = require("express");
const router = express.Router();
const { register, login, logout, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const loginLimiter = require("../middleware/loginLimiter");
const { isIpBlocked } = require("../middleware/ipBlocklist");

router.post("/register", register);
router.post("/login", isIpBlocked, loginLimiter, login);
router.post("/logout", logout);
router.get("/me", protect, getMe);

module.exports = router;