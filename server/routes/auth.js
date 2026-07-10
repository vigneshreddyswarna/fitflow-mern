const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { requireVerified } = require('../middleware/auth');
const { sendEmail } = require('../services/email');
const { devOnlyCode } = require('../utils/dev-code');

const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const safeUser = (user) => ({ id: user._id, name: user.name, email: user.email, goal: user.goal, role: user.role, isEmailVerified: user.isEmailVerified, demoAccount: user.demoAccount, profile: user.profile, trainerProfile: user.trainerProfile });
const hashedToken = value => crypto.createHash('sha256').update(value).digest('hex');
const otpCode = () => String(crypto.randomInt(100000, 1000000));
const listFrom = value => String(value || '').split(',').map(item => item.trim()).filter(Boolean);

async function sendVerificationOtp(user, code) {
  await sendEmail({
    to: user.email,
    subject: 'Your FitFlow verification code',
    text: `Welcome to FitFlow. Your verification code is ${code}. It expires in 10 minutes.`
  });
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, goal } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ message: 'An account with this email already exists' });
    const verificationCode = otpCode();
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12), goal, emailVerificationCode: hashedToken(verificationCode), emailVerificationExpires: Date.now() + 10 * 60 * 1000 });
    await sendVerificationOtp(user, verificationCode);
    res.status(201).json({ token: tokenFor(user), user: safeUser(user), verificationRequired: true, ...devOnlyCode('verificationCode', verificationCode) });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase() }).select('+password');
    if (!user) return res.status(404).json({ message: 'No account found with this email. Please create an account first.' });
    if (!(await bcrypt.compare(req.body.password || '', user.password))) return res.status(401).json({ message: 'Incorrect password' });
    res.json({ token: tokenFor(user), user: safeUser(user) });
  } catch (error) { next(error); }
});

router.get('/me', auth, async (req, res, next) => {
  try { res.json({ user: safeUser(await User.findById(req.user.id)) }); } catch (error) { next(error); }
});

router.patch('/profile', auth, requireVerified, async (req, res, next) => {
  try {
    const allowed = ['experience', 'availableDays', 'preferredMinutes', 'equipment', 'weightKg', 'limitations'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)).map(([key, value]) => [`profile.${key}`, value]));
    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true });
    res.json({ user: safeUser(user) });
  } catch (error) { error.status = 400; next(error); }
});

router.patch('/settings', auth, requireVerified, async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = String(req.body.name).trim();
    if (req.body.goal) updates.goal = req.body.goal;
    ['experience', 'availableDays', 'preferredMinutes', 'equipment', 'weightKg', 'limitations'].forEach(key => {
      if (Object.hasOwn(req.body, key)) updates[`profile.${key}`] = req.body[key];
    });
    if (['trainer', 'admin'].includes(req.user.role)) {
      if (Object.hasOwn(req.body, 'headline')) updates['trainerProfile.headline'] = String(req.body.headline || '').trim();
      if (Object.hasOwn(req.body, 'bio')) updates['trainerProfile.bio'] = String(req.body.bio || '').trim();
      if (Object.hasOwn(req.body, 'specialties')) updates['trainerProfile.specialties'] = Array.isArray(req.body.specialties) ? req.body.specialties : listFrom(req.body.specialties);
      if (Object.hasOwn(req.body, 'certifications')) updates['trainerProfile.certifications'] = Array.isArray(req.body.certifications) ? req.body.certifications : listFrom(req.body.certifications);
    }
    if (req.body.newPassword) {
      if (!req.body.currentPassword) return res.status(400).json({ message: 'Current password is required' });
      if (req.body.newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters' });
      const user = await User.findById(req.user.id).select('+password');
      if (!user || !(await bcrypt.compare(req.body.currentPassword, user.password))) return res.status(401).json({ message: 'Current password is incorrect' });
      if (await bcrypt.compare(req.body.newPassword, user.password)) return res.status(400).json({ message: 'New password cannot be the same as your old password' });
      user.password = await bcrypt.hash(req.body.newPassword, 12);
      user.set(updates);
      await user.save();
      return res.json({ user: safeUser(user), message: 'Settings updated' });
    }
    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true });
    res.json({ user: safeUser(user), message: 'Settings updated' });
  } catch (error) { error.status = 400; next(error); }
});

router.post('/verify-email', async (req, res, next) => {
  try {
    const email = req.body.email?.toLowerCase();
    const code = String(req.body.code || '').trim();
    const token = String(req.body.token || '').trim();
    const query = token
      ? { email, emailVerificationToken: hashedToken(token) }
      : { email, emailVerificationCode: hashedToken(code), emailVerificationExpires: { $gt: Date.now() } };
    const user = await User.findOne(query).select('+emailVerificationToken +emailVerificationCode +emailVerificationExpires');
    if (!user) return res.status(400).json({ message: token ? 'Verification link is invalid or expired' : 'Verification code is invalid or expired' });
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    res.json({ message: 'Email verified successfully', user: safeUser(user) });
  } catch (error) { next(error); }
});

router.post('/resend-verification', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase() }).select('+emailVerificationCode +emailVerificationExpires');
    if (!user) return res.json({ message: 'If that account exists, a new code has been sent' });
    if (user.isEmailVerified) return res.json({ message: 'Email is already verified' });
    const verificationCode = otpCode();
    user.emailVerificationCode = hashedToken(verificationCode);
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    await sendVerificationOtp(user, verificationCode);
    res.json({ message: 'A new verification code has been sent', ...devOnlyCode('verificationCode', verificationCode) });
  } catch (error) { next(error); }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase() }).select('+passwordResetToken +passwordResetExpires');
    if (!user) return res.status(404).json({ message: 'No account found with this email. Please sign up first.' });
    let resetCode;
    resetCode = otpCode();
    user.passwordResetToken = hashedToken(resetCode); user.passwordResetExpires = Date.now() + 10 * 60 * 1000; await user.save();
    await sendEmail({ to: user.email, subject: 'Your FitFlow password reset code', text: `Your FitFlow password reset code is ${resetCode}. It expires in 10 minutes.` });
    res.json({ message: 'Reset code sent to your email', ...devOnlyCode('resetCode', resetCode) });
  } catch (error) { next(error); }
});

router.post('/verify-reset-code', async (req, res, next) => {
  try {
    const code = String(req.body.code || '').trim();
    const user = await User.findOne({ email: req.body.email?.toLowerCase(), passwordResetToken: hashedToken(code), passwordResetExpires: { $gt: Date.now() } }).select('+passwordResetToken +passwordResetExpires');
    if (!user) return res.status(400).json({ message: 'Reset code is invalid or expired' });
    res.json({ message: 'Code verified. Create your new password.' });
  } catch (error) { next(error); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    if (!req.body.password || req.body.password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
    const resetValue = String(req.body.code || req.body.token || '').trim();
    const user = await User.findOne({ email: req.body.email?.toLowerCase(), passwordResetToken: hashedToken(resetValue), passwordResetExpires: { $gt: Date.now() } }).select('+password +passwordResetToken +passwordResetExpires');
    if (!user) return res.status(400).json({ message: 'Reset code is invalid or expired' });
    if (await bcrypt.compare(req.body.password, user.password)) return res.status(400).json({ message: 'New password cannot be the same as your old password' });
    user.password = await bcrypt.hash(req.body.password, 12); user.passwordResetToken = undefined; user.passwordResetExpires = undefined; await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) { next(error); }
});

router.post('/google', async (req, res, next) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ message: 'Google login is not configured' });
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(req.body.credential || '')}`);
    const profile = await response.json();
    if (!response.ok || profile.aud !== process.env.GOOGLE_CLIENT_ID || profile.email_verified !== 'true') return res.status(401).json({ message: 'Google sign-in could not be verified' });
    let user = await User.findOne({ email: profile.email });
    if (!user) user = await User.create({ name: profile.name, email: profile.email, googleId: profile.sub, isEmailVerified: true, password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12) });
    res.json({ token: tokenFor(user), user: safeUser(user) });
  } catch (error) { next(error); }
});

module.exports = router;
