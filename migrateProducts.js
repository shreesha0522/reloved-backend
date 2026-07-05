require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Product = require("./models/Product");

const run = async () => {
  await connectDB();

  const result = await Product.updateMany(
    { status: { $exists: false } },
    { $set: { status: "approved" } }
  );

  console.log(`Updated ${result.modifiedCount} product(s) to status: approved`);

  mongoose.connection.close();
};

run();