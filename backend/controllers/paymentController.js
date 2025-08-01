const stripe = require('../config/stripe');
const License = require('../models/License');
const User = require('../models/User');
const { getEmailTemplate, sendMail } = require('../utils');
const LicenseController = require('./licenseController');
const licenseController = new LicenseController();

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

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
          metadata: {
            userId: userId
          }
        });

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

      const user = await User.findByPk(userId);
      if (!user) {
        console.error('User not found for payment success email:', userId);
        return res.status(404).json({ error: 'User not found' });
      }

      const licenseResult = await licenseController.createLicenseForUser(
        userId,
        projectName,
        {
          isActive: false,
          validationCount: 0,
          features: ['premium_templates', 'advanced_analytics', 'custom_branding']
        }
      );

      const emailTemplate = await getEmailTemplate('payment-success', {
        fullName: user.username,
        projectName: projectName,
        licenseKey: licenseResult.data.licenseKey,
        amount: paymentIntent.amount / 100,
        paymentId: paymentIntent.id
      });

      await sendMail({
        to: user.email,
        subject: 'Payment Successful - Your License Key',
        html: emailTemplate
      });

      res.json({
        success: true,
        license: licenseResult.data,
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
      if (process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET !== 'whsec_your_webhook_secret_here') {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } else {
        console.log('⚠️  Webhook signature verification skipped (no webhook secret configured)');
        event = JSON.parse(req.body);
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);

        try {
          const { projectName, userId } = paymentIntent.metadata;

          await licenseController.createLicenseForUser(
            userId !== 'anonymous' ? userId : null,
            projectName,
            {
              isActive: false,
              validationCount: 0,
              features: ['premium_templates', 'advanced_analytics', 'custom_branding']
            }
          );

          console.log('License auto-generated for payment:', paymentIntent.id);
        } catch (error) {
          console.error('Error auto-generating license:', error);
        }
        break;

      case 'charge.succeeded':
        const charge = event.data.object;
        console.log('Charge succeeded:', charge.id);

        try {
          if (charge.payment_intent) {
            const relatedPaymentIntent = await stripe.paymentIntents.retrieve(charge.payment_intent);
            const { projectName, userId } = relatedPaymentIntent.metadata || {};

            if (projectName && userId) {
              await licenseController.createLicenseForUser(
                userId !== 'anonymous' ? userId : null,
                projectName,
                {
                  isActive: false,
                  validationCount: 0,
                  features: ['premium_templates', 'advanced_analytics', 'custom_branding']
                }
              );

              console.log('License auto-generated for charge:', charge.id);
            }
          }
        } catch (error) {
          console.error('Error auto-generating license from charge:', error);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        break;

      case 'charge.updated':
        console.log('Charge updated:', event.data.object.id);
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

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        customer: user.stripeCustomerId,
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        return_url: 'http://localhost:3000/payment-return',
        metadata: {
          projectName,
          userId: userId
        },
        description: `License for ${projectName}`,
      });

      if (paymentIntent.status === 'succeeded') {
        // Generate license using license controller
        const licenseResult = await licenseController.createLicenseForUser(
          userId,
          projectName,
          {
            isActive: false,
            validationCount: 0,
            features: ['premium_templates', 'advanced_analytics', 'custom_branding']
          }
        );

        const emailTemplate = await getEmailTemplate('payment-success', {
          fullName: user.username,
          projectName: projectName,
          licenseKey: licenseResult.data.licenseKey,
          amount: paymentIntent.amount / 100,
          paymentId: paymentIntent.id
        });

        await sendMail({
          to: user.email,
          subject: 'Payment Successful - Your License Key',
          html: emailTemplate
        });

        res.json({
          success: true,
          license: licenseResult.data,
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
