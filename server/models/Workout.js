const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, trim: true },
  duration: { type: Number, required: true, min: 1, max: 600 },
  calories: { type: Number, min: 0, default: 0 },
  intensity: { type: String, enum: ['Light', 'Moderate', 'Hard'], default: 'Moderate' },
  exercises: [{
    name: { type: String, required: true },
    sets: { type: Number, min: 1 },
    reps: { type: Number, min: 1 },
    weightKg: { type: Number, min: 0 }
  }],
  notes: { type: String, maxlength: 500 },
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Workout', workoutSchema);
