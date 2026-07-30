require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');

const SELLER_EMAIL = 'shreesha@gmail.com'; // <-- confirm this is the right seller account

const tableItems = [
  { image: "/images/table1.jpg", condition: "Like New", price: 1500 },
  { image: "/images/table2.jpg", condition: "Good", price: 1600 },
  { image: "/images/table3.jpg", condition: "Fair", price: 1450 },
  { image: "/images/table4.jpg", condition: "Like New", price: 1300 },
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const seller = await User.findOne({ email: SELLER_EMAIL });

  if (!seller) {
    console.log(`No user found with email: ${SELLER_EMAIL}`);
    process.exit(1);
  }

  const products = tableItems.map((item) => ({
    name: "Tables",
    price: item.price,
    category: "furniture",
    subcategory: "Tables",
    image: item.image,
    description: "",
    stock: 1,
    condition: item.condition,
    sellerId: seller._id,
    status: "approved",
  }));

  const result = await Product.insertMany(products);
  console.log(`Inserted ${result.length} table products.`);
  process.exit(0);
});
