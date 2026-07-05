const BlogPost = require("../models/BlogPost");

// GET /api/blog
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error("getAllPosts error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/blog/:slug
exports.getPostBySlug = async (req, res) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug });
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    res.status(200).json({ success: true, post });
  } catch (error) {
    console.error("getPostBySlug error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/blog — for adding posts later (e.g. from an admin panel)
exports.createPost = async (req, res) => {
  try {
    const { title, slug, excerpt, content, image, author } = req.body;
    if (!title || !slug || !excerpt || !content || !image) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const existing = await BlogPost.findOne({ slug });
    if (existing) {
      return res.status(400).json({ success: false, message: "A post with this slug already exists" });
    }

    const post = await BlogPost.create({ title, slug, excerpt, content, image, author });
    res.status(201).json({ success: true, post });
  } catch (error) {
    console.error("createPost error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};