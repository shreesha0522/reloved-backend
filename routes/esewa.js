const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { initiateEsewaPayment, verifyEsewaPayment } = require("../controllers/esewaController");
const Order = require("../models/Order");

router.post("/initiate", protect, initiateEsewaPayment);
router.post("/verify", protect, verifyEsewaPayment);


module.exports = router;