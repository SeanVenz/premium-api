const express = require('express');
const WebhookController = require('../controllers/webhookController');

const router = express.Router();
const webhookController = new WebhookController();

// Stripe webhook endpoint (raw body needed for signature verification)
router.post('/stripe', express.raw({ type: 'application/json' }), webhookController.handleStripeWebhook);

module.exports = router;
