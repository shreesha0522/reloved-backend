const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getProfile, updateProfile, requestSeller } = require("../controllers/userController");

router.get("/me", protect, getProfile);
router.put("/update", protect, updateProfile);
router.post("/request-seller", protect, requestSeller);

module.exports = router;