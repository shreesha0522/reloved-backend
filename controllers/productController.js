const Product = require("../models/Product");
const User = require("../models/User");


// GET /api/products  — public, anyone can browse, with optional category and search filters
exports.getAllProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { status: "approved" };
    if (category) {
      filter.category = category;
    }
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("getAllProducts error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/:id  — public, single product detail
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("getProductById error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/products  — seller only, create a new product
exports.createProduct = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== "seller") {
      return res.status(403).json({ success: false, message: "Only sellers can add products" });
    }

    const { name, price, category, subcategory, image, description, stock } = req.body;

    if (!name || !price || !category || !image) {
      return res.status(400).json({ success: false, message: "Name, price, category, and image are required" });
    }

    const product = await Product.create({
      name,
      price,
      category,
      subcategory,
      image,
      description,
      stock,
      sellerId: req.userId,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error("createProduct error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/seller/mine  — seller only, list their own products
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("getMyProducts error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/products/:id  — seller only, update own product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, sellerId: req.userId });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found or not yours" });
    }

    const { name, price, category, subcategory, image, description, stock } = req.body;
    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    if (category !== undefined) product.category = category;
    if (subcategory !== undefined) product.subcategory = subcategory;
    if (image !== undefined) product.image = image;
    if (description !== undefined) product.description = description;
    if (stock !== undefined) product.stock = stock;

    await product.save();
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("updateProduct error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/products/:id  — seller only, delete own product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, sellerId: req.userId });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found or not yours" });
    }
    res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("deleteProduct error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};