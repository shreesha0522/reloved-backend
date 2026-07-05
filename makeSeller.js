require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const email = process.argv[2];
  if (!email) {
    console.log("Usage: node makeSeller.js youremail@example.com");
    process.exit(1);
  }
  const user = await User.findOneAndUpdate({ email }, { role: "seller" }, { new: true });
  if (!user) {
    console.log("No user found with that email.");
  } else {
    console.log(`✅ ${user.email} is now a seller.`);
  }
  process.exit(0);
}

run();
