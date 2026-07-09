const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const FitnessClass = require('../models/FitnessClass');

const trainerFields = 'name email role trainerProfile';

router.get('/', async (_req, res, next) => {
  try {
    res.json(await User.find({ role: { $in: ['trainer', 'admin'] }, isEmailVerified: true }).select(trainerFields).sort({ name: 1 }));
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid trainer id' });
    const trainer = await User.findOne({ _id: req.params.id, role: { $in: ['trainer', 'admin'] }, isEmailVerified: true }).select(trainerFields).lean();
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
    const classes = await FitnessClass.find({ trainer: trainer._id, cancelled: false }).select('title category schedule startsAt duration level accent capacity attendees').sort({ startsAt: 1 }).lean();
    res.json({ ...trainer, classes: classes.map(item => ({ ...item, spotsLeft: item.capacity - item.attendees.length })) });
  } catch (error) { next(error); }
});

module.exports = router;
