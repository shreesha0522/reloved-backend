require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Product = require("./models/Product");

const sellerId = "6a4b2ee91a4d74af5dc6fbc9"; // jenisha shrestha (seller)

const sampleProducts = [
  {
    name: "Vintage Floral Midi Dress",
    price: 950,
    category: "clothing",
    subcategory: "Dresses",
    image: "https://picsum.photos/seed/dress1/400/400",
    description: "A lovely pre-loved floral midi dress, perfect for spring.",
    stock: 1,
    condition: "Like New",
  },
  {
    name: "Men's Corduroy Jacket",
    price: 1200,
    category: "clothing",
    subcategory: "Outerwear",
    image: "https://picsum.photos/seed/jacket2/400/400",
    description: "Classic tan corduroy jacket, gently worn.",
    stock: 1,
    condition: "Good",
  },
  {
    name: "Oak Bookshelf",
    price: 3500,
    category: "furniture",
    subcategory: "Storage",
    image: "https://picsum.photos/seed/bookshelf1/400/400",
    description: "Solid oak bookshelf with 4 shelves, minor scuffs.",
    stock: 1,
    condition: "Fair",
  },
  {
    name: "Round Dining Table",
    price: 5200,
    category: "furniture",
    subcategory: "Tables",
    image: "https://picsum.photos/seed/table1/400/400",
    description: "Sturdy round dining table, seats 4 comfortably.",
    stock: 1,
    condition: "Good",
  },
  {
    name: "The Great Gatsby (Paperback)",
    price: 250,
    category: "books",
    subcategory: "Fiction",
    image: "https://picsum.photos/seed/book1/400/400",
    description: "Well-loved copy, some highlighting inside.",
    stock: 2,
    condition: "Fair",
  },
  {
    name: "Children's Storybook Collection",
    price: 400,
    category: "books",
    subcategory: "Children's",
    image: "https://picsum.photos/seed/book2/400/400",
    description: "Set of 5 storybooks, great condition.",
    stock: 1,
    condition: "Like New",
  },
  {
    name: "Ceramic Vase Set",
    price: 600,
    category: "home-goods",
    subcategory: "Decor",
    image: "https://picsum.photos/seed/vase1/400/400",
    description: "Set of 2 handmade ceramic vases, no chips or cracks.",
    stock: 1,
    condition: "Like New",
  },
  {
    name: "Woven Table Runner",
    price: 300,
    category: "home-goods",
    subcategory: "Textiles",
    image: "https://picsum.photos/seed/runner1/400/400",
    description: "Cozy woven table runner, lightly used.",
    stock: 1,
    condition: "Good",
  },
];

const run = async () => {
  await connectDB();

  const productsWithSeller = sampleProducts.map((p) => ({
    ...p,
    sellerId,
    status: "approved",
  }));

  const result = await Product.insertMany(productsWithSeller);
  console.log(`Inserted ${result.length} sample products.`);
  mongoose.connection.close();
};

run();