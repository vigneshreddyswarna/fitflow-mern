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
router.get('/users', roles('admin'), async (_req, res, next) => { try { res.json(await User.find().select('name email role isEmailVerified goal trainerProfile createdAt').sort({ createdAt: -1 })); } catch (error) { next(error); } });
router.patch('/users/:id/role', roles('admin'), async (req, res, next) => {
  try {
    if (!['member', 'trainer', 'admin'].includes(req.body.role)) return res.status(400).json({ message: 'Invalid role' });
    res.json(await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('name email role'));
  } catch (error) { next(error); }
});
router.get('/trainers', roles('admin', 'trainer'), async (_req, res, next) => {
  try { res.json(await User.find({ role: { $in: ['trainer', 'admin'] }, isEmailVerified: true }).select('name email role trainerProfile').sort({ name: 1 })); } catch (error) { next(error); }
});
router.get('/classes', roles('admin', 'trainer'), async (req, res, next) => {
  try {
    const query = req.user.role === 'trainer' ? { trainer: req.user.id, cancelled: false } : { cancelled: false };
    res.json(await FitnessClass.find(query).populate('trainer', 'name email trainerProfile').sort({ startsAt: 1 }));
  } catch (error) { next(error); }
});
router.post('/classes', roles('admin', 'trainer'), async (req, res, next) => { try { res.status(201).json(await FitnessClass.create({ ...req.body, isDemo: false, trainer: req.user.role === 'trainer' ? req.user.id : req.body.trainer })); } catch (error) { error.status = 400; next(error); } });
router.patch('/classes/:id', roles('admin', 'trainer'), async (req, res, next) => { try { res.json(await FitnessClass.findOneAndUpdate(req.user.role === 'trainer' ? { _id: req.params.id, trainer: req.user.id } : { _id: req.params.id }, { ...req.body, isDemo: false }, { new: true, runValidators: true })); } catch (error) { error.status = 400; next(error); } });
router.delete('/classes/:id', roles('admin', 'trainer'), async (req, res, next) => {
  try {
    const query = req.user.role === 'trainer' ? { _id: req.params.id, trainer: req.user.id } : { _id: req.params.id };
    res.json(await FitnessClass.findOneAndUpdate(query, { cancelled: true }, { new: true }));
  } catch (error) { next(error); }
});

module.exports = router;
