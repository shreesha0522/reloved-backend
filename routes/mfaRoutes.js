const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  setupMFA,
  verifySetupMFA,
  verifyLoginMFA,
  disableMFA,
} = require("../controllers/mfaController");

router.post("/setup", protect, setupMFA);
router.post("/verify-setup", protect, verifySetupMFA);
router.post("/verify-login", verifyLoginMFA); // not protected — uses the mfa_pending cookie instead
router.post("/disable", protect, disableMFA);

module.exports = router;