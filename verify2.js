require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const user = await User.findOne({ email: 'shreesha@gmail.com' });
  const singleHash = await bcrypt.hash('12345678', 10);
  const isDoubleHashed = await bcrypt.compare(singleHash, user.password);
  console.log('Was 12345678 double-hashed?', isDoubleHashed);
  process.exit(0);
});
