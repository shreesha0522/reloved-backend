const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validatePassword = require("../utils/validatePassword");

const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Shared cookie options — httpOnly means client-side JS (and therefore XSS)
// cannot read or steal this cookie. secure+sameSite protect it in transit
// and against CSRF from third-party sites.
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches JWT expiry
};

// Short-lived cookie issued when a password check passes but MFA is still
// required. Only usable against /api/mfa/verify-login, and expires quickly.
const pendingCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 5 * 60 * 1000, // 5 minutes
};

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    // Let the pre('save') hook in User.js handle hashing — do NOT hash here
    const user = new User({ username, email, password });
    await user.save();

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: { _id: user._id, username: user.username, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (user.isLocked()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME);
        user.failedLoginAttempts = 0;
        await user.save();
        return res.status(423).json({
          success: false,
          message: "Too many failed attempts. Account locked for 15 minutes.",
        });
      }

      await user.save();
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Password correct — reset failed attempt tracking either way
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // --- MFA gate ---
    // Password alone is not enough for accounts with 2FA enabled. Issue a
    // short-lived "pending" cookie instead of the real session, and tell
    // the frontend a code is required. The real session cookie only gets
    // set after /api/mfa/verify-login succeeds.
    if (user.mfaEnabled) {
      const pendingToken = jwt.sign(
        { id: user._id, mfaPending: true },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
      );
      res.cookie("mfa_pending", pendingToken, pendingCookieOptions);
      return res.status(200).json({
        success: true,
        mfaRequired: true,
        message: "Enter your two-factor authentication code",
      });
    }

    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { _id: user._id, username: user.username, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/logout — clears the cookie server-side
exports.logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.status(200).json({ success: true, message: "Logged out" });
};

// GET /api/auth/me — lets the frontend check who's logged in without
// ever touching the token directly (it's httpOnly, JS can't read it anyway).
// Relies on the `protect` middleware having set req.userId from the cookie.
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
    });
  } catch (error) {
    console.error("getMe error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};