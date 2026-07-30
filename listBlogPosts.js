require('dotenv').config();
const mongoose = require('mongoose');
const BlogPost = require('./models/BlogPost');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const posts = await BlogPost.find({}).select('title slug image createdAt');

  console.log(`Total posts: ${posts.length}\n`);
  posts.forEach((p) => {
    console.log(`${p._id} | ${p.title} | slug: ${p.slug} | image: ${p.image}`);
  });

  process.exit(0);
});
