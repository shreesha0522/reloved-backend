// listAllProducts.js
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const products = await Product.find({}).select('name image category sellerId status createdAt');

  console.log(`Total products: ${products.length}\n`);
  products.forEach((p) => {
    console.log(`${p._id} | ${p.name} | ${p.category} | image: ${p.image} | status: ${p.status}`);
  });

  process.exit(0);
});