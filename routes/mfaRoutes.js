const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const mfaLimiter = require("../middleware/mfaLimiter");
const {
  setupMFA,
  verifySetupMFA,
  verifyLoginMFA,
  disableMFA,
} = require("../controllers/mfaController");

router.post("/setup", protect, setupMFA);
router.post("/verify-setup", protect, mfaLimiter, verifySetupMFA);
router.post("/verify-login", mfaLimiter, verifyLoginMFA); // not protected — uses the mfa_pending cookie instead
router.post("/disable", protect, disableMFA);

module.exports = router;