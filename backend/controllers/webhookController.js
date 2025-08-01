const stripe = require('../config/stripe');
const User = require('../models/User');
const License = require('../models/License');
const { getEmailTemplate, sendMail } = require('../utils');
const LicenseController = require('./licenseController');

// Create an instance of LicenseController
const licenseController = new LicenseController();

class WebhookController {
    async handleStripeWebhook(req, res) {
        const sig = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        try {
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.handlePaymentSuccess(event.data.object);
                    break;

                case 'payment_intent.payment_failed':
                    await this.handlePaymentFailed(event.data.object);
                    break;

                case 'payment_intent.created':
                    console.log('Payment intent created:', event.data.object.id);
                    break;

                case 'charge.failed':
                    await this.handleChargeFailed(event.data.object);
                    break;

                case 'customer.subscription.created':
                    await this.handleSubscriptionCreated(event.data.object);
                    break;

                case 'customer.subscription.updated':
                    await this.handleSubscriptionUpdated(event.data.object);
                    break;

                case 'customer.subscription.deleted':
                    await this.handleSubscriptionCanceled(event.data.object);
                    break;

                case 'invoice.payment_succeeded':
                    await this.handleInvoicePaymentSucceeded(event.data.object);
                    break;

                case 'invoice.payment_failed':
                    await this.handleInvoicePaymentFailed(event.data.object);
                    break;

                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }

            res.json({ received: true });
        } catch (error) {
            console.error('Error handling webhook:', error);
            res.status(500).json({ error: 'Webhook handler failed' });
        }
    }

    async handlePaymentSuccess(paymentIntent) {
        console.log('Payment succeeded:', paymentIntent.id);

        try {
            // Get customer from Stripe
            const customer = await stripe.customers.retrieve(paymentIntent.customer);

            // Find user by email or stripeCustomerId
            const user = await User.findOne({
                where: {
                    [require('sequelize').Op.or]: [
                        { email: customer.email },
                        { stripeCustomerId: customer.id }
                    ]
                }
            });

            if (!user) {
                console.error('User not found for customer:', customer.id);
                return;
            }

            // Extract project information from metadata
            const projectName = paymentIntent.metadata?.projectName || 'Premium License';
            const amount = paymentIntent.amount / 100;

            // Create license using license controller
            const licenseResult = await licenseController.createLicenseForUser(
                user.id,
                projectName,
                {
                    isActive: false,
                    validationCount: 0,
                    features: ['premium_templates', 'advanced_analytics', 'custom_branding']
                }
            );

            const license = licenseResult.data;

            const emailTemplate = await getEmailTemplate('payment-success', {
                fullName: user.username,
                projectName: projectName,
                licenseKey: license.licenseKey,
                amount: amount,
                paymentId: paymentIntent.id
            });

            await sendMail({
                to: user.email,
                subject: `Payment Successful - Your ${projectName} License`,
                html: emailTemplate
            });

            console.log('License created and email sent for user:', user.email);

        } catch (error) {
            console.error('Error handling payment success:', error);
        }
    }

    async handlePaymentFailed(paymentIntent) {
        console.log('Payment failed:', paymentIntent.id);

        try {
            // Get customer from Stripe
            const customer = await stripe.customers.retrieve(paymentIntent.customer);

            const user = await User.findOne({
                where: {
                    [require('sequelize').Op.or]: [
                        { email: customer.email },
                        { stripeCustomerId: customer.id }
                    ]
                }
            });

            if (!user) {
                console.error('User not found for customer:', customer.id);
                return;
            }

            // Send payment failed email
            const emailTemplate = await getEmailTemplate('payment-failed', {
                fullName: user.username,
                projectName: paymentIntent.metadata?.projectName || 'Premium License',
                failureReason: paymentIntent.last_payment_error?.message || 'Unknown error'
            });

            await sendMail({
                to: user.email,
                subject: 'Payment Failed - Please Try Again',
                html: emailTemplate
            });

            console.log('Payment failure email sent to:', user.email);

        } catch (error) {
            console.error('Error handling payment failure:', error);
        }
    }

    async handleChargeFailed(charge) {
        console.log('Charge failed:', charge.id);
    }

    async handleSubscriptionCreated(subscription) {
        console.log('Subscription created:', subscription.id);
    }

    async handleSubscriptionUpdated(subscription) {
        console.log('Subscription updated:', subscription.id);
    }

    async handleSubscriptionCanceled(subscription) {
        console.log('Subscription canceled:', subscription.id);
    }

    async handleInvoicePaymentSucceeded(invoice) {
        console.log('Invoice payment succeeded:', invoice.id);
    }

    async handleInvoicePaymentFailed(invoice) {
        console.log('Invoice payment failed:', invoice.id);
    }
}

module.exports = WebhookController;
