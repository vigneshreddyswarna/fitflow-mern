require('dotenv').config();
const mongoose = require('mongoose');
const { seedDemoClasses } = require('../routes/classes');

async function run() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);
  await seedDemoClasses();
  await mongoose.disconnect();
}

run().then(() => console.log('Demo classes seeded')).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
