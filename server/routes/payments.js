const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireVerified } = require('../middleware/auth');

router.post('/checkout', auth, requireVerified, async (req, res, next) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) return res.status(503).json({ message: 'Payments are not configured yet' });
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.APP_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.APP_URL}/dashboard?payment=cancelled`,
      client_reference_id: req.user.id
    });
    res.json({ url: session.url });
  } catch (error) { next(error); }
});

module.exports = router;
