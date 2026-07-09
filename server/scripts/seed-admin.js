require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seed() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.MONGODB_URI) throw new Error('Set MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD first');
  if (process.env.ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD must contain at least 12 characters');
  await mongoose.connect(process.env.MONGODB_URI);
  const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  await User.findOneAndUpdate({ email: process.env.ADMIN_EMAIL.toLowerCase() }, { $set: { name: process.env.ADMIN_NAME || 'FitFlow Admin', password, role: 'admin', isEmailVerified: true } }, { upsert: true, new: true, runValidators: true });
  console.log(`Admin ready: ${process.env.ADMIN_EMAIL}`);
  await mongoose.disconnect();
}

seed().catch(error => { console.error(error.message); process.exit(1); });
