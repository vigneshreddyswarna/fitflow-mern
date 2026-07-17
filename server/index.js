const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/classes');
const workoutRoutes = require('./routes/workouts');
const coachRoutes = require('./routes/coach');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const paymentRoutes = require('./routes/payments');
const trainerRoutes = require('./routes/trainers');
const { webhook: stripeWebhook } = paymentRoutes;

const app = express();
const PORT = process.env.PORT || 5000;

function validateEnv() {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter(name => !process.env[name]);
  if (missing.length) throw new Error(`${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} missing. Copy .env.example to .env.`);
}

app.set('trust proxy', 1);
app.use(pinoHttp({ logger }));
app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false }));
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? false : (process.env.APP_URL || 'http://localhost:5173') }));
app.use(cookieParser());
app.post('/api/payments/webhook', express.raw({ type: 'application/json', limit: '256kb' }), stripeWebhook);
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
app.get('/api/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected || process.env.NODE_ENV === 'test' ? 200 : 503).json({ status: connected ? 'ok' : 'degraded', database: connected ? 'connected' : 'disconnected' });
});

if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '../client/dist');
  app.use(express.static(dist));
  app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, req, res, _next) => {
  req.log?.error({ err, requestId: req.id }, 'request failed');
  const status = err.status || 500;
  const safeMessage = status >= 500 && process.env.NODE_ENV === 'production' ? 'Something went wrong' : (err.message || 'Something went wrong');
  res.status(status).json({ message: safeMessage, code: err.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'), requestId: req.id });
});

async function start() {
  try {
    validateEnv();
    await mongoose.connect(process.env.MONGODB_URI);
    app.listen(PORT, () => logger.info({ port: PORT }, 'FitFlow API started'));
  } catch (error) {
    logger.fatal({ err: error }, 'Startup failed');
    process.exit(1);
  }
}

if (require.main === module) start();

module.exports = { app, start, validateEnv };
