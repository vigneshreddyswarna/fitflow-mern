const mongoose = require('mongoose');

const coachingPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  weekOf: { type: Date, required: true },
  summary: { type: String, required: true },
  sessions: [{ day: String, title: String, type: { type: String }, minutes: Number, instructions: String, classId: { type: mongoose.Schema.Types.ObjectId, ref: 'FitnessClass' }, completed: { type: Boolean, default: false } }],
  source: { type: String, enum: ['ai', 'rules'], default: 'rules' },
  safetyNote: { type: String, default: 'This plan is general fitness guidance, not medical advice.' }
}, { timestamps: true });

module.exports = mongoose.model('CoachingPlan', coachingPlanSchema);
