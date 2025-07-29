const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  getPaymentDetails,
  handlePaymentSuccess,
  handleWebhook,
  getStripeConfig,
  getSavedPaymentMethods,
  createPaymentWithSavedMethod
} = require('../controllers/paymentController');
const authenticateToken = require('../middleware/authMiddleware');

// Get Stripe configuration (publishable key)
router.get('/config', getStripeConfig);

// Create payment intent for license purchase
router.post('/create-payment-intent', authenticateToken, createPaymentIntent);

// Get user's saved payment methods
router.get('/payment-methods', authenticateToken, getSavedPaymentMethods);

// Create payment with saved payment method
router.post('/pay-with-saved-method', authenticateToken, createPaymentWithSavedMethod);

// Get payment details
router.get('/payment/:paymentIntentId', authenticateToken, getPaymentDetails);

// Handle successful payment and generate license
router.post('/payment-success', handlePaymentSuccess);

// Webhook endpoint for Stripe events
// Note: This should be before any body parsing middleware for raw body access
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
