const mongoose = require('mongoose');

const fitnessClassSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  coach: { type: String, required: true },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  schedule: { type: String, required: true },
  startsAt: { type: Date, required: true, default: () => new Date(Date.now() + 86400000) },
  recurrence: { type: String, enum: ['none', 'weekly'], default: 'weekly' },
  duration: { type: Number, required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  capacity: { type: Number, default: 16 },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  waitlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  price: { type: Number, min: 0, default: 0 },
  cancelled: { type: Boolean, default: false },
  isDemo: { type: Boolean, default: false },
  accent: { type: String, default: '#c7f36b' }
}, { timestamps: true });

module.exports = mongoose.model('FitnessClass', fitnessClassSchema);
