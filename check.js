require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const emails = ['jenisha@gmail.com', 'shreesha@gmail.com'];
  for (const email of emails) {
    const user = await User.findOne({ email });
    if (!user) { console.log(email, '-> NOT FOUND'); continue; }
    const match = await bcrypt.compare('12345678', user.password);
    console.log(email, '-> hash:', user.password.slice(0,15)+'...', '| matches 12345678:', match);
  }
  process.exit(0);
});
