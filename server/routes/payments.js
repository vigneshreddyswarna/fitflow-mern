const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireVerified } = require('../middleware/auth');
const User = require('../models/User');
const validate = require('../middleware/validate');
const schemas = require('../validation/schemas');

router.post('/checkout', auth, requireVerified, validate(schemas.checkout), async (req, res, next) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) return res.status(503).json({ message: 'Payments are not configured yet' });
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.APP_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.APP_URL}/dashboard?payment=cancelled`,
      client_reference_id: req.user.id,
      metadata: { userId: req.user.id },
      subscription_data: { metadata: { userId: req.user.id } }
    });
    res.json({ url: session.url });
  } catch (error) { next(error); }
});

async function webhook(req, res) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ message: 'Stripe webhook is not configured' });
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.header('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).json({ message: 'Invalid Stripe signature' });
  }
  const object = event.data.object;
  const userId = object.metadata?.userId || object.client_reference_id;
  if (userId && ['checkout.session.completed', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
    const subscription = event.type === 'checkout.session.completed' && object.subscription
      ? await stripe.subscriptions.retrieve(object.subscription)
      : object;
    const status = event.type === 'customer.subscription.deleted' ? 'cancelled' : (['active', 'trialing'].includes(subscription.status) ? 'active' : 'past_due');
    await User.findByIdAndUpdate(userId, { $set: {
      'membership.status': status,
      'membership.stripeCustomerId': String(object.customer || subscription.customer || ''),
      'membership.stripeSubscriptionId': String(subscription.id || object.subscription || ''),
      'membership.currentPeriodEnd': subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined
    } });
  }
  res.json({ received: true });
}

module.exports = router;
module.exports.webhook = webhook;
