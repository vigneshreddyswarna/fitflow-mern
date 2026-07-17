const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/classes');
const workoutRoutes = require('./routes/workouts');
const coachRoutes = require('./routes/coach');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const paymentRoutes = require('./routes/payments');
const trainerRoutes = require('./routes/trainers');

const app = express();
const PORT = process.env.PORT || 5000;

function validateEnv() {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter(name => !process.env[name]);
  if (missing.length) throw new Error(`${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} missing. Copy .env.example to .env.`);
}

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false }));
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? false : (process.env.APP_URL || 'http://localhost:5173') }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: 'draft-8', legacyHeaders: false }));
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/trainers', trainerRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '../client/dist');
  app.use(express.static(dist));
  app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong' });
});

async function start() {
  try {
    validateEnv();
    await mongoose.connect(process.env.MONGODB_URI);
    app.listen(PORT, () => console.log(`FitFlow API running at http://localhost:${PORT}`));
  } catch (error) {
    console.error(`Startup failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) start();

module.exports = { app, start, validateEnv };
