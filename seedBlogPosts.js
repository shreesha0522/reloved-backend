require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const BlogPost = require("./models/BlogPost");

const samplePosts = [
  {
    title: "5 Ways to Style a Vintage Denim Jacket",
    slug: "5-ways-to-style-vintage-denim-jacket",
    excerpt: "A good denim jacket only gets better with age. Here's how to make it work for every season.",
    content: `There's a reason vintage denim jackets never go out of style — they're durable, versatile, and only look better with a bit of wear.

Layer it over a summer dress for an easy day-to-night look, or throw it on with wide-leg trousers for something more polished. In colder months, it works surprisingly well as a mid-layer under a heavier coat.

The best part about buying secondhand denim? It's already broken in. No stiff, uncomfortable "new jacket" phase — just soft, worn-in fabric that fits like it was made for you.

Next time you're browsing our Clothing section, keep an eye out for pieces with a little character — a faded patch, a slightly frayed cuff. Those details are what make vintage pieces feel truly one-of-a-kind.`,
    image: "https://picsum.photos/seed/blog-denim/800/500",
    author: "ReLoved Team",
  },
  {
    title: "Why Secondhand Furniture Just Makes Sense",
    slug: "why-secondhand-furniture-makes-sense",
    excerpt: "Older furniture is often better built, better priced, and better for the planet. Here's why we love it.",
    content: `New furniture has a problem: a lot of it isn't built to last. Particleboard, thin veneers, and glued joints mean today's flat-pack pieces often don't survive more than a few moves.

Secondhand furniture, especially anything more than a decade old, was frequently built with solid wood and real joinery. It's heavier, sturdier, and — with a little care — can outlast anything you'd buy new for the same price.

There's also the environmental angle. Manufacturing new furniture takes real resources: wood, metal, foam, fabric, and the energy to ship it all. Buying secondhand means one less item produced from scratch, and one more good piece kept in use.

Our Furniture category is full of pieces with real history — chairs, tables, and shelving that have already lived full lives and have plenty more left in them.`,
    image: "https://picsum.photos/seed/blog-furniture/800/500",
    author: "ReLoved Team",
  },
  {
    title: "How We Review Every Listing on ReLoved",
    slug: "how-we-review-every-listing",
    excerpt: "Every item on ReLoved goes through an approval process before it goes live. Here's what we check for.",
    content: `Buying secondhand should feel just as safe and easy as buying new — that's why every single listing on ReLoved goes through a review before it's visible to shoppers.

When a seller lists an item, our team checks that the photos accurately represent the piece, the condition rating (Like New, Good, or Fair) is honest, and the description gives you everything you need to know before buying.

If something doesn't meet our standards, we reach out to the seller directly with feedback so they can update the listing and resubmit.

This process takes a little longer than an instant listing, but it means when you browse ReLoved, you can trust that what you see is what you'll get.`,
    image: "https://picsum.photos/seed/blog-review/800/500",
    author: "ReLoved Team",
  },
];

const run = async () => {
  await connectDB();
  const result = await BlogPost.insertMany(samplePosts);
  console.log(`Inserted ${result.length} sample blog posts.`);
  mongoose.connection.close();
};

run();