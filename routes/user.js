const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getProfile, updateProfile, requestSeller, exportUserData } = require("../controllers/userController");

router.get("/me", protect, getProfile);
router.put("/update", protect, updateProfile);
router.post("/request-seller", protect, requestSeller);
router.get("/export-data", protect, exportUserData);

module.exports = router;