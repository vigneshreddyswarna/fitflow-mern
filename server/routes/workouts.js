const router = require('express').Router();
const Workout = require('../models/Workout');
const auth = require('../middleware/auth');
const { requireVerified } = require('../middleware/auth');
const User = require('../models/User');
const Measurement = require('../models/Measurement');

router.use(auth);
router.use(requireVerified);
router.get('/', async (req, res, next) => {
  try { res.json(await Workout.find({ user: req.user.id }).sort({ completedAt: -1 }).limit(30)); } catch (error) { next(error); }
});
router.post('/', async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    const met = { Light: 3.5, Moderate: 6, Hard: 8.5 }[req.body.intensity] || 6;
    const weight = user.profile?.weightKg || 70;
    const calories = req.body.calories > 0 ? req.body.calories : Math.round((met * 3.5 * weight / 200) * Number(req.body.duration));
    const workout = await Workout.create({ ...req.body, calories, user: req.user.id });
    res.status(201).json(workout);
  } catch (error) { error.status = 400; next(error); }
});

router.get('/measurements', async (req, res, next) => {
  try { res.json(await Measurement.find({ user: req.user.id }).sort({ measuredAt: -1 }).limit(50)); } catch (error) { next(error); }
});
router.post('/measurements', async (req, res, next) => {
  try { res.status(201).json(await Measurement.create({ ...req.body, user: req.user.id })); } catch (error) { error.status = 400; next(error); }
});
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await Workout.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deleted) return res.status(404).json({ message: 'Workout not found' });
    res.json({ message: 'Workout removed' });
  } catch (error) { next(error); }
});

module.exports = router;
