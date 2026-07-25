const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { encrypt, decrypt } = require("../utils/encryption");

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Short-lived cookie used only to bridge "password verified" -> "2FA code verified"
// during login. It carries no privileges by itself — it can only be used against
// the /mfa/verify-login endpoint, and expires in 5 minutes.
const pendingCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 5 * 60 * 1000,
};

// POST /api/mfa/setup — protected, called from account settings.
// Generates a new TOTP secret and returns a QR code for the user to scan.
// Does NOT enable MFA yet — that only happens after verify-setup succeeds,
// so a user can't accidentally lock themselves out with an untested setup.
exports.setupMFA = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const secret = speakeasy.generateSecret({
      name: `ReLoved (${user.email})`,
    });

    user.mfaSecret = encrypt(secret.base32);
    user.mfaEnabled = false; // not active until confirmed
    await user.save();

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      success: true,
      qrCode: qrCodeDataUrl,
      manualEntryKey: secret.base32, // fallback if they can't scan the QR
    });
  } catch (error) {
    console.error("setupMFA error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mfa/verify-setup — protected. Confirms the user's authenticator
// app is actually working before turning MFA on for their account.
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
      window: 1, // allows the code from 1 step before/after, for clock drift
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: "Invalid code. Please try again." });
    }

    user.mfaEnabled = true;
    await user.save();

    res.status(200).json({ success: true, message: "Two-factor authentication enabled." });
  } catch (error) {
    console.error("verifySetupMFA error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mfa/verify-login — public, but requires the short-lived
// "mfa_pending" cookie set by authController.login(). Completes the login
// by issuing the real session cookie once the TOTP code checks out.
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
      return res.status(401).json({ success: false, message: "Invalid code" });
    }

    // 2FA passed — clear the pending cookie and issue the real session
    res.clearCookie("mfa_pending", pendingCookieOptions);

    const token = generateToken(user._id);
    res.cookie("token", token, sessionCookieOptions);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { _id: user._id, username: user.username, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("verifyLoginMFA error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mfa/disable — protected. Requires the current password as
// confirmation, so an attacker with a hijacked session alone can't turn
// off 2FA on someone else's account.
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

    res.status(200).json({ success: true, message: "Two-factor authentication disabled." });
  } catch (error) {
    console.error("disableMFA error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

