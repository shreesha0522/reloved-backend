require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');

const SELLER_EMAIL = 'shreesha@gmail.com'; // <-- confirm this is the right seller account

const chairItems = [
  { image: "/images/chair1.jpg", condition: "Like New", price: 700 },
  { image: "/images/chair2.jpg", condition: "Good", price: 800 },
  { image: "/images/chair3.jpg", condition: "Fair", price: 900 },
  { image: "/images/chair4.jpg", condition: "Like New", price: 1200 },
  { image: "/images/chair5.jpg", condition: "Like New", price: 800 },
  { image: "/images/chair6.jpg", condition: "Like New", price: 900 },
  { image: "/images/chair7.jpg", condition: "Fair", price: 600 },
  { image: "/images/chair8.jpg", condition: "Good", price: 1100 },
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const seller = await User.findOne({ email: SELLER_EMAIL });

  if (!seller) {
    console.log(`No user found with email: ${SELLER_EMAIL}`);
    process.exit(1);
  }

  const products = chairItems.map((item) => ({
    name: "Chairs",
    price: item.price,
    category: "furniture",
    subcategory: "Chairs",
    image: item.image,
    description: "",
    stock: 1,
    condition: item.condition,
    sellerId: seller._id,
    status: "approved",
  }));

  const result = await Product.insertMany(products);
  console.log(`Inserted ${result.length} chair products.`);
  process.exit(0);
});
