const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireVerified } = require('../middleware/auth');
const User = require('../models/User');
const Workout = require('../models/Workout');
const FitnessClass = require('../models/FitnessClass');
const CoachingPlan = require('../models/CoachingPlan');
const Notification = require('../models/Notification');
const { generatePlan } = require('../services/coach');

router.use(auth);
router.use(requireVerified);
router.get('/plan', async (req, res, next) => {
  try { res.json(await CoachingPlan.findOne({ user: req.user.id }).sort({ createdAt: -1 }).populate('sessions.classId')); } catch (error) { next(error); }
});
router.post('/plan', async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    const [workouts, classes] = await Promise.all([Workout.find({ user: req.user.id }).sort({ completedAt: -1 }).limit(20).lean(), FitnessClass.find({ startsAt: { $gte: new Date() }, cancelled: false }).lean()]);
    const generated = await generatePlan(user, workouts, classes);
    const weekOf = new Date(); weekOf.setHours(0, 0, 0, 0);
    const plan = await CoachingPlan.create({ user: req.user.id, weekOf, ...generated });
    await Notification.create({ user: req.user.id, type: 'plan', title: 'Your week is ready', message: generated.summary });
    res.status(201).json(plan);
  } catch (error) { next(error); }
});
router.patch('/plan/:planId/session/:sessionId', async (req, res, next) => {
  try {
    const plan = await CoachingPlan.findOne({ _id: req.params.planId, user: req.user.id });
    const session = plan?.sessions.id(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Plan session not found' });
    session.completed = Boolean(req.body.completed); await plan.save(); res.json(plan);
  } catch (error) { next(error); }
});

module.exports = router;
