// utils/sendEmail.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

async function sendOrderConfirmationEmail(toEmail, order) {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #D8E0D9;">
          <strong>${item.name}</strong><br/>
          <span style="color:#6B7B76;font-size:13px;">Qty: ${item.qty}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #D8E0D9;text-align:right;">
          Rs ${item.price * item.qty}
        </td>
      </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1A2E2A;">
      <h2 style="color:#4A6B5A;">ReLoved</h2>
      <p>Hi ${order.shippingAddress?.name || "there"},</p>
      <p>Thanks for your order! We've received your payment and your order is now confirmed.</p>

      <div style="background:#E8EDE6;padding:16px;border-radius:8px;margin:20px 0;">
        <p style="margin:0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p style="margin:4px 0 0;"><strong>Delivery:</strong> ${
          order.deliveryOption === "standard" ? "Standard Delivery" : "Local Pickup"
        }</p>
      </div>

      <table style="width:100%;border-collapse:collapse;">
        ${itemsHtml}
      </table>

      <table style="width:100%;margin-top:12px;">
        <tr><td>Item Total</td><td style="text-align:right;">Rs ${order.itemTotal}</td></tr>
        <tr><td>Delivery Fee</td><td style="text-align:right;">${
          order.deliveryFee === 0 ? "Free" : `Rs ${order.deliveryFee}`
        }</td></tr>
        <tr>
          <td style="font-weight:bold;padding-top:8px;">Total</td>
          <td style="text-align:right;font-weight:bold;color:#4A6B5A;padding-top:8px;">Rs ${order.total}</td>
        </tr>
      </table>

      <p style="margin-top:24px;font-size:13px;color:#6B7B76;">
        Shipping to: ${order.shippingAddress?.address || "—"}<br/>
        ${order.shippingAddress?.phone || ""}
      </p>

      <p style="margin-top:24px;">We'll let you know when your order ships. Thanks for giving these pieces a new home!</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"ReLoved" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Order Confirmed — ${order.orderNumber}`,
    html,
  });
}

async function sendOrderStatusEmail(toEmail, order) {
  const statusLabels = {
    confirmed: "Confirmed",
    packed: "Packed",
    ready_to_ship: "Ready to Ship",
    in_transit: "In Transit",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
  };

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1A2E2A;">
      <h2 style="color:#4A6B5A;">ReLoved</h2>
      <p>Hi there,</p>
      <p>Your order status has been updated.</p>
      <div style="background:#E8EDE6;padding:16px;border-radius:8px;margin:20px 0;">
        <p style="margin:0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p style="margin:8px 0 0;"><strong>New Status:</strong>
          <span style="color:#4A6B5A;font-weight:bold;">
            ${statusLabels[order.orderStatus] || order.orderStatus}
          </span>
        </p>
      </div>
      <p>Thanks for giving these pieces a new home!</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"ReLoved" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Order ${order.orderNumber} — Status Updated`,
    html,
  });
}

async function sendProductApprovedEmail(toEmail, product) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1A2E2A;">
      <h2 style="color:#4A6B5A;">ReLoved</h2>
      <p>Good news!</p>
      <p>Your listing <strong>${product.name}</strong> has been approved and is now live on the shop.</p>
      <div style="background:#E8EDE6;padding:16px;border-radius:8px;margin:20px 0;">
        <p style="margin:0;"><strong>Item:</strong> ${product.name}</p>
        <p style="margin:4px 0 0;"><strong>Price:</strong> Rs ${product.price}</p>
      </div>
      <p>Thanks for selling with us!</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"ReLoved" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your listing "${product.name}" is approved`,
    html,
  });
}

async function sendProductRejectedEmail(toEmail, product) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1A2E2A;">
      <h2 style="color:#4A6B5A;">ReLoved</h2>
      <p>Hi there,</p>
      <p>Unfortunately, your listing <strong>${product.name}</strong> was not approved.</p>
      ${
        product.rejectionReason
          ? `<div style="background:#E8EDE6;padding:16px;border-radius:8px;margin:20px 0;">
              <p style="margin:0;"><strong>Reason:</strong> ${product.rejectionReason}</p>
            </div>`
          : ""
      }
      <p>You're welcome to update the listing and resubmit it.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"ReLoved" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your listing "${product.name}" was not approved`,
    html,
  });
}

async function sendAccountStatusEmail(toEmail, isActive) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1A2E2A;">
      <h2 style="color:#4A6B5A;">ReLoved</h2>
      <p>Hi there,</p>
      <p>Your account has been <strong>${isActive ? "reactivated" : "deactivated"}</strong> by an administrator.</p>
      ${
        !isActive
          ? `<p>If you believe this is a mistake, please contact our support team.</p>`
          : `<p>You can now log in and continue using your account as normal.</p>`
      }
    </div>
  `;

  await transporter.sendMail({
    from: `"ReLoved" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your account has been ${isActive ? "reactivated" : "deactivated"}`,
    html,
  });
}

async function sendSellerRequestApprovedEmail(toEmail) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1A2E2A;">
      <h2 style="color:#4A6B5A;">ReLoved</h2>
      <p>Good news!</p>
      <p>Your request to become a seller has been <strong>approved</strong>. You can now log in and start listing your pre-loved items.</p>
      <p>Thanks for joining our community!</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"ReLoved" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your seller request has been approved`,
    html,
  });
}

async function sendSellerRequestRejectedEmail(toEmail) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1A2E2A;">
      <h2 style="color:#4A6B5A;">ReLoved</h2>
      <p>Hi there,</p>
      <p>Unfortunately, your request to become a seller was not approved at this time.</p>
      <p>If you believe this is a mistake, please contact our support team.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"ReLoved" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your seller request was not approved`,
    html,
  });
}


// Sends a real-time security alert to the site admin when a serious
// security event occurs (IP blocked, account locked, etc.). Fire-and-forget
// by design — a failed alert email should never break the request that
// triggered it, so callers should not await this in a blocking way that
// fails the response.
async function sendSecurityAlertEmail(eventType, details) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1A2E2A;">
      <h2 style="color:#C0392B;">⚠️ Security Alert — ReLoved</h2>
      <p><strong>Event:</strong> ${eventType}</p>
      <div style="background:#FDEDEC;padding:16px;border-radius:8px;margin:20px 0;border-left:4px solid #C0392B;">
        <pre style="margin:0;white-space:pre-wrap;font-family:monospace;font-size:13px;">${JSON.stringify(details, null, 2)}</pre>
      </div>
      <p style="font-size:13px;color:#6B7B76;">Detected at ${new Date().toISOString()}</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"ReLoved Security" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // alerts go to the site admin
      subject: `🚨 Security Alert: ${eventType}`,
      html,
    });
  } catch (err) {
    // Never let an alerting failure crash the request that triggered it
    console.error("Failed to send security alert email:", err.message);
  }
}

module.exports = {
  sendSecurityAlertEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendProductApprovedEmail,
  sendProductRejectedEmail,
  sendAccountStatusEmail,
  sendSellerRequestApprovedEmail,
  sendSellerRequestRejectedEmail,
};