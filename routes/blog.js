const express = require("express");
const router = express.Router();
const {
  getAllPosts,
  getPostById,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
} = require("../controllers/blogController");
const { protect } = require("../middleware/authMiddleware");

const adminOnly = require("../middleware/adminOnly");

router.get("/", getAllPosts);
router.get("/id/:id", getPostById);
router.get("/:slug", getPostBySlug);

router.post("/", protect, adminOnly, createPost);
router.put("/:id", protect, adminOnly, updatePost);
router.delete("/:id", protect, adminOnly, deletePost);

module.exports = router;