const crypto = require("crypto");

function generateEsewaSignature(totalAmount, transactionUuid, productCode, secretKey) {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto.createHmac("sha256", secretKey).update(message).digest("base64");
}

module.exports = { generateEsewaSignature };