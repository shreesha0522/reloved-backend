const crypto = require("crypto");
const Order = require("../models/Order");
const { generateEsewaSignature } = require("../utils/esewaSignature");
const User = require("../models/User");
const { sendOrderConfirmationEmail } = require("../utils/sendEmail");
const logActivity = require("../utils/logActivity");

exports.initiateEsewaPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, userId: req.userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const totalAmount = order.total.toFixed(2);
    const transactionUuid = `${order.orderNumber}-${Date.now()}`;

    const productCode = process.env.ESEWA_PRODUCT_CODE;
    const secretKey = process.env.ESEWA_SECRET_KEY;

    const signature = generateEsewaSignature(totalAmount, transactionUuid, productCode, secretKey);

    order.transactionUuid = transactionUuid;
    await order.save();

    logActivity("PAYMENT_INITIATED", { userId: req.userId, ip: req.ip, details: { orderId: order._id } });

    res.status(200).json({
      success: true,
      formAction: process.env.ESEWA_FORM_URL,
      fields: {
        amount: order.itemTotal.toFixed(2),
        tax_amount: "0",
        total_amount: totalAmount,
        transaction_uuid: transactionUuid,
        product_code: productCode,
        product_service_charge: "0",
        product_delivery_charge: order.deliveryFee.toFixed(2),
        success_url: `${process.env.FRONTEND_URL}/payment/esewa-callback`,
        failure_url: `${process.env.FRONTEND_URL}/payment?orderId=${order._id}&status=failed`,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature,
      },
    });
  } catch (error) {
    console.error("initiateEsewaPayment error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyEsewaPayment = async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, message: "Missing payment data" });
    }

    const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    const { transaction_uuid, product_code, total_amount, signature, signed_field_names, status } = decoded;

    if (!signed_field_names) {
      return res.status(400).json({ success: false, message: "Missing signed_field_names in response" });
    }

    const fieldsToSign = signed_field_names.split(",");
    const message = fieldsToSign.map((field) => `${field}=${decoded[field]}`).join(",");

    const expectedSignature = crypto
      .createHmac("sha256", process.env.ESEWA_SECRET_KEY)
      .update(message)
      .digest("base64");

    if (expectedSignature !== signature) {
      logActivity("PAYMENT_SIGNATURE_MISMATCH", { userId: req.userId, ip: req.ip, details: { transaction_uuid } });
      return res.status(400).json({ success: false, message: "Signature mismatch — possible tampering" });
    }

    if (status !== "COMPLETE") {
      return res.status(400).json({ success: false, message: "Payment not completed" });
    }

    const statusUrl = `${process.env.ESEWA_STATUS_URL}?product_code=${product_code}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`;
    const statusRes = await fetch(statusUrl);
    const statusData = await statusRes.json();

    if (statusData.status !== "COMPLETE") {
      logActivity("PAYMENT_VERIFICATION_FAILED", { userId: req.userId, ip: req.ip, details: { transaction_uuid } });
      return res.status(400).json({ success: false, message: "Payment could not be verified with eSewa" });
    }

    const order = await Order.findOne({ transactionUuid: transaction_uuid, userId: req.userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found for this transaction" });
    }

    order.paymentStatus = "paid";
    await order.save();

    logActivity("PAYMENT_VERIFIED", { userId: req.userId, ip: req.ip, details: { orderId: order._id, transaction_uuid } });

    try {
      const user = await User.findById(req.userId);
      if (user?.email) {
        await sendOrderConfirmationEmail(user.email, order);
        console.log("✅ Order confirmation email sent to", user.email);
      } else {
        console.log("⚠️ No email found on user — skipping order confirmation email");
      }
    } catch (emailError) {
      console.error("❌ Order confirmation email failed:", emailError.message);
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("verifyEsewaPayment error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
