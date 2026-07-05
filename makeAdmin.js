require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");

const run = async () => {
  await connectDB();

  const user = await User.findOneAndUpdate(
    { email: "shreesha@gmail.com" },
    { role: "admin" },
    { new: true }
  );

  if (!user) {
    console.log("User not found");
  } else {
    console.log("Updated user:", user.email, "-> role:", user.role);
  }

  mongoose.connection.close();
};

run();