const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validatePassword = require("../utils/validatePassword");
const { recordFailedAttempt, clearFailedAttempts } = require("../middleware/ipBlocklist");
const { sendSecurityAlertEmail } = require("../utils/sendEmail");
const verifyCaptcha = require("../utils/verifyCaptcha");
const logActivity = require("../utils/logActivity");

const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const pendingCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 5 * 60 * 1000,
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, captchaToken } = req.body;

    const captchaValid = await verifyCaptcha(captchaToken);
    if (!captchaValid) {
      return res.status(400).json({ success: false, message: "CAPTCHA verification failed. Please try again." });
    }

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

    const user = new User({ username, email, password });
    await user.save();

    logActivity("USER_REGISTERED", { userId: user._id, ip: req.ip });

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
    const { email, password, captchaToken } = req.body;

    const captchaValid = await verifyCaptcha(captchaToken);
    if (!captchaValid) {
      return res.status(400).json({ success: false, message: "CAPTCHA verification failed. Please try again." });
    }

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      recordFailedAttempt(req);
      logActivity("LOGIN_FAILED", { ip: req.ip, details: { reason: "unknown_email" } });
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (user.isLocked()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      logActivity("LOGIN_BLOCKED_ACCOUNT_LOCKED", { userId: user._id, ip: req.ip });
      return res.status(423).json({
        success: false,
        message: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      recordFailedAttempt(req);
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME);
        user.failedLoginAttempts = 0;
        await user.save();

        logActivity("ACCOUNT_LOCKED", { userId: user._id, ip: req.ip });

        sendSecurityAlertEmail("Account Locked", {
          email: user.email,
          userId: user._id.toString(),
          ip: req.ip,
          lockedForMinutes: LOCK_TIME / 60000,
        }).catch(() => {});
        return res.status(423).json({
          success: false,
          message: "Too many failed attempts. Account locked for 15 minutes.",
        });
      }

      await user.save();
      logActivity("LOGIN_FAILED", { userId: user._id, ip: req.ip, details: { reason: "wrong_password" } });
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    clearFailedAttempts(req);
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    if (user.mfaEnabled) {
      const pendingToken = jwt.sign(
        { id: user._id, mfaPending: true },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
      );
      res.cookie("mfa_pending", pendingToken, pendingCookieOptions);
      logActivity("LOGIN_MFA_PENDING", { userId: user._id, ip: req.ip });
      return res.status(200).json({
        success: true,
        mfaRequired: true,
        message: "Enter your two-factor authentication code",
      });
    }

    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions);

    logActivity("LOGIN_SUCCESS", { userId: user._id, ip: req.ip });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        passwordExpired: user.isPasswordExpired(),
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.status(200).json({ success: true, message: "Logged out" });
};

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
