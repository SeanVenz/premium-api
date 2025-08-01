const express = require('express');
const WebhookController = require('../controllers/webhookController');

const router = express.Router();
const webhookController = new WebhookController();

// Fix: Bind the context properly
router.post('/stripe', express.raw({ type: 'application/json' }), (req, res) => {
    webhookController.handleStripeWebhook(req, res);
});

module.exports = router;
