const stripe = require('../config/stripe');
const License = require('../models/License');
const User = require('../models/User');

class PaymentController {

  async createPaymentIntent(req, res) {
    try {
      const { projectName, amount = 2999, savePaymentMethod = false } = req.body;
      const userId = req.user?.id;

    if (!projectName) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Get user details
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create or get Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: {
          userId: userId
        }
      });
      
      // Save the Stripe customer ID to user
      await user.update({ stripeCustomerId: customer.id });
      stripeCustomerId = customer.id;
    }

    const paymentIntentData = {
      amount: amount, 
      currency: 'usd',
      customer: stripeCustomerId,
      metadata: {
        projectName,
        userId: userId
      },
      description: `License for ${projectName}`,
    };

    // If user wants to save payment method, set it up for future use
    if (savePaymentMethod) {
      paymentIntentData.setup_future_usage = 'off_session';
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: amount,
      currency: 'usd',
      projectName,
      customerId: stripeCustomerId
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

async getPaymentDetails(req, res) {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    res.json({
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata,
      created: paymentIntent.created
    });

  } catch (error) {
    console.error('Error retrieving payment:', error);
    res.status(500).json({ error: 'Failed to retrieve payment details' });
  }
};

async handlePaymentSuccess(req, res) {
  try {
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const { projectName, userId } = paymentIntent.metadata;

    const licenseKey = License.generateLicenseKey();

    const license = await License.create({
      licenseKey,
      project: projectName,
      isActive: false,
      features: ['premium_templates', 'advanced_analytics', 'custom_branding'],
      userId: userId !== 'anonymous' ? userId : null,
      validationCount: 0
    });

    res.json({
      success: true,
      license: {
        id: license.id,
        licenseKey: license.licenseKey,
        project: license.project,
        isActive: license.isActive,
        features: license.features
      },
      paymentDetails: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }
    });

  } catch (error) {
    console.error('Error handling payment success:', error);
    res.status(500).json({ error: 'Failed to process payment and generate license' });
  }
};

// Webhook handler for Stripe events
async handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Only verify webhook signature if webhook secret is configured
    if (process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET !== 'whsec_your_webhook_secret_here') {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      // For testing without webhook secret, just parse the body
      console.log('⚠️  Webhook signature verification skipped (no webhook secret configured)');
      event = JSON.parse(req.body);
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // Auto-generate license when payment succeeds
      try {
        const { projectName, userId } = paymentIntent.metadata;
        const licenseKey = License.generateLicenseKey();

        await License.create({
          licenseKey,
          project: projectName,
          isActive: false,
          features: ['premium_templates', 'advanced_analytics', 'custom_branding'],
          userId: userId !== 'anonymous' ? userId : null,
          validationCount: 0
        });

        console.log('License auto-generated for payment:', paymentIntent.id);
      } catch (error) {
        console.error('Error auto-generating license:', error);
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

// Get Stripe publishable key for frontend
async getStripeConfig(req, res) {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
};

// Get user's saved payment methods
async getSavedPaymentMethods(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const user = await User.findByPk(userId);
    if (!user || !user.stripeCustomerId) {
      return res.json({ paymentMethods: [] });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card'
    });

    const formattedMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      card: {
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year
      },
      created: pm.created
    }));

    res.json({ paymentMethods: formattedMethods });

  } catch (error) {
    console.error('Error getting saved payment methods:', error);
    res.status(500).json({ error: 'Failed to retrieve payment methods' });
  }
};

// Create payment with saved payment method
async createPaymentWithSavedMethod(req, res) {
  try {
    const { projectName, paymentMethodId, amount = 2999 } = req.body;
    const userId = req.user?.id;

    if (!projectName || !paymentMethodId) {
      return res.status(400).json({ error: 'Project name and payment method are required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const user = await User.findByPk(userId);
    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ error: 'User or Stripe customer not found' });
    }

    // Create payment intent with saved payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      customer: user.stripeCustomerId,
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      return_url: 'http://localhost:3000/payment-return', // Add your return URL
      metadata: {
        projectName,
        userId: userId
      },
      description: `License for ${projectName}`,
    });

    if (paymentIntent.status === 'succeeded') {
      // Generate license immediately
      const licenseKey = License.generateLicenseKey();

      const license = await License.create({
        licenseKey,
        project: projectName,
        isActive: false,
        features: ['premium_templates', 'advanced_analytics', 'custom_branding'],
        userId: userId,
        validationCount: 0
      });

      res.json({
        success: true,
        license: {
          id: license.id,
          licenseKey: license.licenseKey,
          project: license.project,
          isActive: license.isActive,
          features: license.features
        },
        paymentDetails: {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status
        }
      });
    } else {
      res.json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret
      });
    }

  } catch (error) {
    console.error('Error creating payment with saved method:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
};
}

module.exports = PaymentController;
