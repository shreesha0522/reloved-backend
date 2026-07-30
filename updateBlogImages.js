require('dotenv').config();
const mongoose = require('mongoose');
const BlogPost = require('./models/BlogPost');

const updates = [
  { slug: "how-we-review-every-listing", image: "/images/collection1.png" },
  { slug: "5-ways-to-style-vintage-denim-jacket", image: "/images/bottom1.jpg" },
  { slug: "why-secondhand-furniture-makes-sense", image: "/images/chair8.jpg" },
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
  let updated = 0;

  for (const item of updates) {
    const result = await BlogPost.updateOne(
      { slug: item.slug },
      { $set: { image: item.image } }
    );
    if (result.modifiedCount > 0) updated++;
  }

  console.log(`Updated ${updated} blog post images.`);
  process.exit(0);
});
