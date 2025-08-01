const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const payment = new PaymentController();

const authenticateToken = require('../middleware/authMiddleware');

router.get('/config', payment.getStripeConfig);

router.post('/create-payment-intent', authenticateToken, payment.createPaymentIntent);

router.get('/payment-methods', authenticateToken, payment.getSavedPaymentMethods);

router.post('/pay-with-saved-method', authenticateToken, payment.createPaymentWithSavedMethod);

router.get('/payment/:paymentIntentId', authenticateToken, payment.getPaymentDetails);

router.post('/payment-success', payment.handlePaymentSuccess);

router.post('/webhook', express.raw({ type: 'application/json' }), payment.handleWebhook);

module.exports = router;
