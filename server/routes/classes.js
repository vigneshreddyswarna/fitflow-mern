const router = require('express').Router();
const FitnessClass = require('../models/FitnessClass');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { requireVerified } = require('../middleware/auth');
const Notification = require('../models/Notification');
const { sendEmail } = require('../services/email');
const Workout = require('../models/Workout');

const demoClasses = [
  { title: 'Power Hour', category: 'Strength', coach: 'Maya Rao', schedule: 'Mon - 6:30 PM', duration: 50, level: 'Intermediate', capacity: 14, accent: '#c7f36b' },
  { title: 'Iron Basics', category: 'Strength', coach: 'Kabir Singh', schedule: 'Tue - 5:30 PM', duration: 45, level: 'Beginner', capacity: 16, accent: '#d8f985' },
  { title: 'Lower Body Burn', category: 'Strength', coach: 'Anika Bose', schedule: 'Thu - 7:00 AM', duration: 50, level: 'Intermediate', capacity: 14, accent: '#bfe85e' },
  { title: 'Strong Circuit', category: 'Strength', coach: 'Rohan Das', schedule: 'Sat - 6:00 PM', duration: 55, level: 'Advanced', capacity: 12, accent: '#e0ff95' },
  { title: 'Upper Body Build', category: 'Strength', coach: 'Kabir Singh', schedule: 'Sun - 5:00 PM', duration: 45, level: 'Intermediate', capacity: 15, accent: '#cff477' },
  { title: 'Flow State', category: 'Yoga', coach: 'Aarav Mehta', schedule: 'Tue - 7:00 AM', duration: 45, level: 'Beginner', capacity: 18, accent: '#a8d8ff' },
  { title: 'Sunrise Stretch', category: 'Yoga', coach: 'Isha Menon', schedule: 'Mon - 7:00 AM', duration: 40, level: 'Beginner', capacity: 20, accent: '#bce4ff' },
  { title: 'Balance Flow', category: 'Yoga', coach: 'Aarav Mehta', schedule: 'Thu - 6:30 PM', duration: 50, level: 'Intermediate', capacity: 16, accent: '#8fcaff' },
  { title: 'Power Yoga', category: 'Yoga', coach: 'Meera Nair', schedule: 'Sun - 8:00 AM', duration: 55, level: 'Advanced', capacity: 14, accent: '#c9ecff' },
  { title: 'Pulse HIIT', category: 'Cardio', coach: 'Neha Kapoor', schedule: 'Wed - 6:00 PM', duration: 35, level: 'Advanced', capacity: 12, accent: '#ff9a78' },
  { title: 'Cardio Kickstart', category: 'Cardio', coach: 'Neha Kapoor', schedule: 'Mon - 6:00 PM', duration: 30, level: 'Beginner', capacity: 18, accent: '#ffb199' },
  { title: 'Spin Surge', category: 'Cardio', coach: 'Dev Patel', schedule: 'Fri - 7:00 AM', duration: 45, level: 'Intermediate', capacity: 16, accent: '#ff8a64' },
  { title: 'Endurance Engine', category: 'Cardio', coach: 'Sara Khan', schedule: 'Sat - 8:00 AM', duration: 50, level: 'Advanced', capacity: 14, accent: '#ffc2ad' },
  { title: 'Dance Cardio', category: 'Cardio', coach: 'Tara Iyer', schedule: 'Tue - 6:00 PM', duration: 40, level: 'Beginner', capacity: 22, accent: '#ffa98d' },
  { title: 'Sprint Lab', category: 'Cardio', coach: 'Dev Patel', schedule: 'Thu - 6:00 AM', duration: 35, level: 'Advanced', capacity: 12, accent: '#ff7654' },
  { title: 'Core Control', category: 'Mobility', coach: 'Rohan Das', schedule: 'Sat - 9:00 AM', duration: 40, level: 'Beginner', capacity: 16, accent: '#d6b8ff' },
  { title: 'Desk Reset', category: 'Mobility', coach: 'Priya Shah', schedule: 'Wed - 7:30 AM', duration: 30, level: 'Beginner', capacity: 20, accent: '#e1caff' },
  { title: 'Hip and Spine Care', category: 'Mobility', coach: 'Rohan Das', schedule: 'Fri - 6:30 PM', duration: 40, level: 'Intermediate', capacity: 16, accent: '#c9a5ff' },
  { title: 'Athletic Recovery', category: 'Mobility', coach: 'Meera Nair', schedule: 'Sun - 6:00 PM', duration: 45, level: 'Advanced', capacity: 14, accent: '#eadcff' }
];

const demoClass = item => ({ ...item, isDemo: true });

async function seedDemoClasses() {
  const demoTitles = demoClasses.map(item => item.title);
  const trainers = await User.find({ role: 'trainer', isEmailVerified: true }).select('_id name').sort({ name: 1 }).lean();
  await FitnessClass.updateMany({ isDemo: true, title: { $nin: demoTitles }, attendees: { $size: 0 }, waitlist: { $size: 0 } }, { $set: { cancelled: true } });
  await FitnessClass.bulkWrite(demoClasses.map((item, index) => {
    const trainer = trainers[index % Math.max(trainers.length, 1)];
    const insertClass = demoClass(item);
    if (trainer) delete insertClass.coach;
    return {
    updateOne: {
      filter: { title: item.title, category: item.category },
      update: {
        $setOnInsert: insertClass,
        ...(trainer ? { $set: { trainer: trainer._id, coach: trainer.name } } : {})
      },
      upsert: true
    }
  }; }));
}

const publicClass = item => {
  const trainer = item.trainer && typeof item.trainer === 'object' ? item.trainer : null;
  return {
    ...item,
    trainerName: trainer?.name || item.coach || 'FitFlow Trainer',
    trainer: trainer?._id || item.trainer,
    spotsLeft: item.capacity - item.attendees.length
  };
};

router.get('/', async (_req, res, next) => {
  try {
    await seedDemoClasses();
    const classes = await FitnessClass.find({ cancelled: false }).populate('trainer', 'name trainerProfile').sort({ startsAt: 1 }).lean();
    res.json(classes.map(publicClass));
  } catch (error) { next(error); }
});

router.get('/stats/summary', async (_req, res, next) => {
  try {
    await seedDemoClasses();
    const [members, classes, workouts] = await Promise.all([
      User.countDocuments({ isEmailVerified: true }),
      FitnessClass.countDocuments({ cancelled: false }),
      Workout.countDocuments()
    ]);
    res.json({ members, classes, workouts });
  } catch (error) { next(error); }
});

router.post('/:id/book', auth, requireVerified, async (req, res, next) => {
  try {
    const booked = await FitnessClass.findOneAndUpdate(
      { _id: req.params.id, attendees: { $ne: req.user.id }, cancelled: false, $expr: { $lt: [{ $size: '$attendees' }, '$capacity'] } },
      { $addToSet: { attendees: req.user.id } },
      { new: true }
    );
    if (!booked) {
      const existing = await FitnessClass.findById(req.params.id);
      if (!existing) return res.status(404).json({ message: 'Class not found' });
      if (existing.cancelled) return res.status(409).json({ message: 'This class was cancelled' });
      if (existing.attendees.some(id => id.equals(req.user.id))) return res.status(409).json({ message: 'You already booked this class' });
      await FitnessClass.findByIdAndUpdate(existing._id, { $addToSet: { waitlist: req.user.id } });
      return res.status(202).json({ message: 'Class is full - you were added to the waitlist', waitlisted: true, spotsLeft: 0 });
    }
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { bookedClasses: booked._id } });
    const user = await User.findById(req.user.id);
    await Notification.create({ user: req.user.id, type: 'booking', title: 'Class booked', message: `${booked.title} - ${booked.schedule}` });
    await sendEmail({ to: user.email, subject: `Booked: ${booked.title}`, text: `Your FitFlow class is confirmed for ${booked.schedule}.` });
    res.json({ message: 'Class booked successfully', waitlisted: false, spotsLeft: booked.capacity - booked.attendees.length });
  } catch (error) { next(error); }
});

router.delete('/:id/book', auth, requireVerified, async (req, res, next) => {
  try {
    const item = await FitnessClass.findOne({ _id: req.params.id, attendees: req.user.id });
    if (!item) return res.status(404).json({ message: 'Booking not found' });
    item.attendees.pull(req.user.id);
    const promoted = item.waitlist.shift();
    if (promoted) {
      item.attendees.push(promoted);
      await User.findByIdAndUpdate(promoted, { $addToSet: { bookedClasses: item._id } });
      await Notification.create({ user: promoted, type: 'booking', title: 'A spot opened up', message: `You are now booked into ${item.title}.` });
    }
    await item.save();
    await User.findByIdAndUpdate(req.user.id, { $pull: { bookedClasses: item._id } });
    res.json({ message: 'Booking cancelled' });
  } catch (error) { next(error); }
});

router.get('/mine/booked', auth, requireVerified, async (req, res, next) => {
  try { res.json(await FitnessClass.find({ attendees: req.user.id }).sort('createdAt')); } catch (error) { next(error); }
});

module.exports = router;
