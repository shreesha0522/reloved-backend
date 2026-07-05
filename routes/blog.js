const express = require("express");
const router = express.Router();
const { getAllPosts, getPostBySlug, createPost } = require("../controllers/blogController");

router.get("/", getAllPosts);
router.get("/:slug", getPostBySlug);
router.post("/", createPost);

module.exports = router;