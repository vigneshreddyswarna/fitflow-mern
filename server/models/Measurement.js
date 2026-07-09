const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  weightKg: { type: Number, min: 25, max: 350 },
  bodyFatPercent: { type: Number, min: 2, max: 70 },
  waistCm: { type: Number, min: 30, max: 250 },
  note: { type: String, maxlength: 300 },
  measuredAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Measurement', measurementSchema);
