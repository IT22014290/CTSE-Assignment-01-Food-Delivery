require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI;

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    app.listen(PORT, () => {
      console.log(`Restaurant service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start restaurant service:', error.message);
    process.exit(1);
  }
}

start();
