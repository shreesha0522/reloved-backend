require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const user = await User.findOne({ email: 'shreesha@gmail.com' });
  const singleHash = await bcrypt.hash('12345678', 10);
  const doubleHash1 = await bcrypt.hash(singleHash, 10);
  console.log('Stored hash:      ', user.password);
  const matchesSingle = await bcrypt.compare('12345678', user.password);
  console.log('Matches single-hash of 12345678:', matchesSingle);
  process.exit(0);
});
