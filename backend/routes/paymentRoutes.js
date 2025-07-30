const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const payment = new PaymentController();

const authenticateToken = require('../middleware/authMiddleware');

// Get Stripe configuration (publishable key)
router.get('/config', payment.getStripeConfig);

// Create payment intent for license purchase
router.post('/create-payment-intent', authenticateToken, payment.createPaymentIntent);

// Get user's saved payment methods
router.get('/payment-methods', authenticateToken, payment.getSavedPaymentMethods);

// Create payment with saved payment method
router.post('/pay-with-saved-method', authenticateToken, payment.createPaymentWithSavedMethod);

// Get payment details
router.get('/payment/:paymentIntentId', authenticateToken, payment.getPaymentDetails);

// Handle successful payment and generate license
router.post('/payment-success', payment.handlePaymentSuccess);

// Webhook endpoint for Stripe events
// Note: This should be before any body parsing middleware for raw body access
router.post('/webhook', express.raw({ type: 'application/json' }), payment.handleWebhook);

module.exports = router;
