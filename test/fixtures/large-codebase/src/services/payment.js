const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

async function createPaymentIntent(amount, currency = 'usd') {
  return stripe.paymentIntents.create({
    amount,
    currency,
  });
}

function verifyWebhook(payload, signature) {
  return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
}

module.exports = { createPaymentIntent, verifyWebhook };
