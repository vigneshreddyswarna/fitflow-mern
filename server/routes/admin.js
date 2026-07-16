const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireVerified } = require('../middleware/auth');
const roles = require('../middleware/roles');
const User = require('../models/User');
const FitnessClass = require('../models/FitnessClass');
const Workout = require('../models/Workout');

router.use(auth);
router.use(requireVerified);
router.get('/overview', roles('admin', 'trainer'), async (req, res, next) => {
  try {
    const [members, classes, workouts] = await Promise.all([User.countDocuments({ role: 'member' }), FitnessClass.countDocuments(), Workout.countDocuments()]);
    res.json({ members, classes, workouts });
  } catch (error) { next(error); }
});
router.get('/analytics', roles('admin', 'trainer'), async (req, res, next) => {
  try {
    const classQuery = req.user.role === 'trainer' ? { trainer: req.user.id, cancelled: false } : { cancelled: false };
    const classes = await FitnessClass.find(classQuery).populate('trainer', 'name').lean();
    const totalBookings = classes.reduce((sum, item) => sum + (item.attendees || []).length, 0);
    const totalCapacity = classes.reduce((sum, item) => sum + item.capacity, 0);
    const attended = classes.reduce((sum, item) => sum + (item.attendance || []).filter(mark => mark.status === 'attended').length, 0);
    const missed = classes.reduce((sum, item) => sum + (item.attendance || []).filter(mark => mark.status === 'missed').length, 0);
    const trainerMap = new Map();
    classes.forEach(item => {
      const trainerName = item.trainer?.name || item.coach || 'Unassigned';
      const current = trainerMap.get(trainerName) || { trainer: trainerName, classes: 0, bookings: 0 };
      current.classes += 1;
      current.bookings += (item.attendees || []).length;
      trainerMap.set(trainerName, current);
    });
    res.json({
      totals: {
        totalBookings,
        totalCapacity,
        fillRate: totalCapacity ? Math.round((totalBookings / totalCapacity) * 100) : 0,
        waitlisted: classes.reduce((sum, item) => sum + (item.waitlist || []).length, 0),
        attended,
        missed,
        attendanceRate: attended + missed ? Math.round((attended / (attended + missed)) * 100) : 0
      },
      topClasses: classes
        .map(item => ({ title: item.title, bookings: (item.attendees || []).length, waitlist: (item.waitlist || []).length, capacity: item.capacity }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5),
      topTrainers: Array.from(trainerMap.values()).sort((a, b) => b.bookings - a.bookings).slice(0, 5)
    });
  } catch (error) { next(error); }
});
router.get('/users', roles('admin'), async (_req, res, next) => { try { res.json(await User.find().select('name email role isEmailVerified goal trainerProfile createdAt').sort({ createdAt: -1 })); } catch (error) { next(error); } });
router.patch('/users/:id/role', roles('admin'), async (req, res, next) => {
  try {
    if (!['member', 'trainer', 'admin'].includes(req.body.role)) return res.status(400).json({ message: 'Invalid role' });
    res.json(await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('name email role'));
  } catch (error) { next(error); }
});
router.get('/trainers', roles('admin', 'trainer'), async (_req, res, next) => {
  try { res.json(await User.find({ role: 'trainer', isEmailVerified: true }).select('name email role trainerProfile').sort({ name: 1 })); } catch (error) { next(error); }
});
router.get('/classes', roles('admin', 'trainer'), async (req, res, next) => {
  try {
    const query = req.user.role === 'trainer' ? { trainer: req.user.id, cancelled: false } : { cancelled: false };
    res.json(await FitnessClass.find(query).populate('trainer', 'name email trainerProfile').populate('attendees', 'name email').populate('waitlist', 'name email').populate('attendance.user', 'name email').sort({ startsAt: 1 }));
  } catch (error) { next(error); }
});

async function classPayload(req) {
  const allowed = ['title', 'category', 'schedule', 'startsAt', 'duration', 'level', 'capacity'];
  const payload = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  payload.isDemo = false;
  const trainerId = req.user.role === 'trainer' ? req.user.id : req.body.trainer;
  if (!trainerId) {
    const error = new Error('Choose a verified trainer for this class');
    error.status = 400;
    throw error;
  }
  const trainer = await User.findOne({ _id: trainerId, role: 'trainer', isEmailVerified: true }).select('name');
  if (!trainer) {
    const error = new Error('Trainer must be a verified trainer account');
    error.status = 400;
    throw error;
  }
  payload.trainer = trainer._id;
  payload.coach = trainer.name;
  return payload;
}

router.post('/classes', roles('admin', 'trainer'), async (req, res, next) => {
  try { res.status(201).json(await FitnessClass.create(await classPayload(req))); } catch (error) { error.status ||= 400; next(error); }
});
router.patch('/classes/:id', roles('admin', 'trainer'), async (req, res, next) => {
  try {
    res.json(await FitnessClass.findOneAndUpdate(req.user.role === 'trainer' ? { _id: req.params.id, trainer: req.user.id } : { _id: req.params.id }, await classPayload(req), { new: true, runValidators: true }));
  } catch (error) { error.status ||= 400; next(error); }
});
router.delete('/classes/:id', roles('admin', 'trainer'), async (req, res, next) => {
  try {
    const query = req.user.role === 'trainer' ? { _id: req.params.id, trainer: req.user.id } : { _id: req.params.id };
    res.json(await FitnessClass.findOneAndUpdate(query, { cancelled: true }, { new: true }));
  } catch (error) { next(error); }
});

router.patch('/classes/:id/attendance/:userId', roles('admin', 'trainer'), async (req, res, next) => {
  try {
    if (!['attended', 'missed'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid attendance status' });
    const query = req.user.role === 'trainer' ? { _id: req.params.id, trainer: req.user.id } : { _id: req.params.id };
    const item = await FitnessClass.findOne(query);
    if (!item) return res.status(404).json({ message: 'Class not found' });
    if (!item.attendees.some(id => id.equals(req.params.userId))) return res.status(400).json({ message: 'Only booked members can be marked' });
    if (!Array.isArray(item.attendance)) item.attendance = [];
    const existing = item.attendance.find(mark => mark.user.equals(req.params.userId));
    if (existing) {
      existing.status = req.body.status;
      existing.markedAt = new Date();
    } else {
      item.attendance.push({ user: req.params.userId, status: req.body.status });
    }
    await item.save();
    res.json(await FitnessClass.findById(item._id).populate('trainer', 'name email trainerProfile').populate('attendees', 'name email').populate('waitlist', 'name email').populate('attendance.user', 'name email'));
  } catch (error) { next(error); }
});

module.exports = router;
