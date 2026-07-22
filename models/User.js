const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "user", "seller"], default: "user" },
    sellerRequestStatus: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" },

    // --- brute-force protection ---
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },

    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    wishlist: [
      {
        id: String,
        name: String,
        price: Number,
        image: String,
        category: String,
      },
    ],
    cart: [
      {
        id: String,
        name: String,
        price: Number,
        image: String,
        qty: Number,
        sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Returns true if the account is currently locked out
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

module.exports = mongoose.model("User", userSchema);