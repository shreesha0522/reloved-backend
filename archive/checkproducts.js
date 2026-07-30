require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const products = await Product.find({}, 'name category');
  if (products.length === 0) {
    console.log('NO PRODUCTS FOUND IN DATABASE');
  } else {
    products.forEach(p => console.log(p.name, '|', p.category));
  }
  process.exit(0);
});
