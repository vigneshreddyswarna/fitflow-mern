const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireVerified } = require('../middleware/auth');
const Notification = require('../models/Notification');

router.use(auth);
router.use(requireVerified);
router.get('/', async (req, res, next) => { try { res.json(await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(30)); } catch (error) { next(error); } });
router.patch('/:id/read', async (req, res, next) => { try { res.json(await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { read: true }, { new: true })); } catch (error) { next(error); } });

module.exports = router;
