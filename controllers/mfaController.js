const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { encrypt, decrypt } = require("../utils/encryption");
const logActivity = require("../utils/logActivity");

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const sessionCookieOptions = {
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

exports.setupMFA = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const secret = speakeasy.generateSecret({
      name: `ReLoved (${user.email})`,
    });

    user.mfaSecret = encrypt(secret.base32);
    user.mfaEnabled = false;
    await user.save();

    logActivity("MFA_SETUP_STARTED", { userId: user._id, ip: req.ip });

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      success: true,
      qrCode: qrCodeDataUrl,
      manualEntryKey: secret.base32,
    });
  } catch (error) {
    console.error("setupMFA error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifySetupMFA = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Code is required" });

    const user = await User.findById(req.userId);
    if (!user || !user.mfaSecret) {
      return res.status(400).json({ success: false, message: "MFA setup not started" });
    }

    const verified = speakeasy.totp.verify({
      secret: decrypt(user.mfaSecret),
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!verified) {
      logActivity("MFA_SETUP_FAILED", { userId: user._id, ip: req.ip });
      return res.status(400).json({ success: false, message: "Invalid code. Please try again." });
    }

    user.mfaEnabled = true;
    await user.save();

    logActivity("MFA_ENABLED", { userId: user._id, ip: req.ip });

    res.status(200).json({ success: true, message: "Two-factor authentication enabled." });
  } catch (error) {
    console.error("verifySetupMFA error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyLoginMFA = async (req, res) => {
  try {
    const pendingToken = req.cookies?.mfa_pending;
    if (!pendingToken) {
      return res.status(401).json({ success: false, message: "No pending login. Please log in again." });
    }

    let decoded;
    try {
      decoded = jwt.verify(pendingToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: "Login session expired. Please log in again." });
    }

    if (!decoded.mfaPending) {
      return res.status(401).json({ success: false, message: "Invalid session. Please log in again." });
    }

    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Code is required" });

    const user = await User.findById(decoded.id);
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return res.status(400).json({ success: false, message: "MFA is not enabled on this account" });
    }

    const verified = speakeasy.totp.verify({
      secret: decrypt(user.mfaSecret),
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!verified) {
      logActivity("LOGIN_MFA_FAILED", { userId: user._id, ip: req.ip });
      return res.status(401).json({ success: false, message: "Invalid code" });
    }

    res.clearCookie("mfa_pending", pendingCookieOptions);

    const token = generateToken(user._id);
    res.cookie("token", token, sessionCookieOptions);

    logActivity("LOGIN_SUCCESS", { userId: user._id, ip: req.ip, details: { viaMFA: true } });

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
    console.error("verifyLoginMFA error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.disableMFA = async (req, res) => {
  try {
    const { currentPassword } = req.body;
    if (!currentPassword) {
      return res.status(400).json({ success: false, message: "Current password is required" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    user.mfaEnabled = false;
    user.mfaSecret = null;
    await user.save();

    logActivity("MFA_DISABLED", { userId: user._id, ip: req.ip });

    res.status(200).json({ success: true, message: "Two-factor authentication disabled." });
  } catch (error) {
    console.error("disableMFA error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
