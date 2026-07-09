const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['member', 'trainer', 'admin'], default: 'member' },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, select: false },
  emailVerificationCode: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  googleId: { type: String, sparse: true },
  goal: { type: String, enum: ['Build strength', 'Lose weight', 'Improve fitness', 'Stay active'], default: 'Stay active' },
  trainerProfile: {
    headline: { type: String, maxlength: 100, default: '' },
    bio: { type: String, maxlength: 500, default: '' },
    specialties: [{ type: String, maxlength: 40 }],
    certifications: [{ type: String, maxlength: 80 }]
  },
  profile: {
    experience: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    availableDays: [{ type: String }],
    preferredMinutes: { type: Number, min: 10, max: 180, default: 30 },
    equipment: [{ type: String }],
    weightKg: { type: Number, min: 25, max: 350 },
    limitations: { type: String, maxlength: 500, default: '' }
  },
  bookedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FitnessClass' }]
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
