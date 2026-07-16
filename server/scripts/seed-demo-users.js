require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const demoUsers = [
  {
    name: process.env.DEMO_ADMIN_NAME || 'FitFlow Demo Admin',
    email: process.env.DEMO_ADMIN_EMAIL,
    password: process.env.DEMO_ADMIN_PASSWORD,
    role: 'admin'
  },
  {
    name: process.env.DEMO_TRAINER_NAME || 'FitFlow Demo Trainer',
    email: process.env.DEMO_TRAINER_EMAIL,
    password: process.env.DEMO_TRAINER_PASSWORD,
    role: 'trainer',
    trainerProfile: {
      headline: 'Demo trainer for recruiter walkthroughs',
      bio: 'A safe demo account used to preview trainer-owned class management without sharing a personal password.',
      specialties: ['Strength', 'Mobility', 'Consistency'],
      certifications: ['FitFlow Demo Certified']
    }
  },
  {
    name: process.env.DEMO_MEMBER_NAME || 'FitFlow Demo Member',
    email: process.env.DEMO_MEMBER_EMAIL,
    password: process.env.DEMO_MEMBER_PASSWORD,
    role: 'member'
  }
];

async function seedDemoUsers() {
  if (process.env.ALLOW_DEMO_ACCOUNTS !== 'true') throw new Error('Set ALLOW_DEMO_ACCOUNTS=true before creating demo users');
  if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI first');
  const missing = demoUsers.flatMap(user => (!user.email || !user.password) ? [`${user.role.toUpperCase()} demo email/password`] : []);
  if (missing.length) throw new Error(`Missing demo credentials: ${missing.join(', ')}`);
  if (demoUsers.some(user => user.password.length < 12)) throw new Error('Demo passwords must contain at least 12 characters');

  await mongoose.connect(process.env.MONGODB_URI);
  for (const user of demoUsers) {
    const password = await bcrypt.hash(user.password, 12);
    await User.findOneAndUpdate(
      { email: user.email.toLowerCase() },
      { $set: { ...user, email: user.email.toLowerCase(), password, isEmailVerified: true, demoAccount: true } },
      { upsert: true, new: true, runValidators: true }
    );
    console.log(`${user.role} demo ready: ${user.email}`);
  }
  await mongoose.disconnect();
}

seedDemoUsers().catch(error => { console.error(error.message); process.exit(1); });
