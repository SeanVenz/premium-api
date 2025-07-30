import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { paymentAPI } from '../services/api';

// Stripe promise (initialize once)
let stripePromise;

const Payment = () => {
  const [stripeKey, setStripeKey] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const config = await paymentAPI.getStripeConfig();
        setStripeKey(config.publishableKey);
        stripePromise = loadStripe(config.publishableKey);
      } catch (error) {
        console.error('Error loading Stripe config:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeStripe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading payment system...</div>
      </div>
    );
  }

  if (!stripeKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Failed to load payment system</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Elements stripe={stripePromise}>
        <PaymentForm />
      </Elements>
    </div>
  );
};

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { user, logout } = useAuth();

  const [selectedProject, setSelectedProject] = useState('');
  const [savedMethods, setSavedMethods] = useState([]);
  const [selectedSavedMethod, setSelectedSavedMethod] = useState(null);
  const [showNewCard, setShowNewCard] = useState(true);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const projects = [
    { value: 'pikocode-premium', label: 'Pikocode Premium' },
    { value: 'quiz-builder', label: 'Quiz Builder' }
  ];

  useEffect(() => {
    loadSavedPaymentMethods();
  }, []);

  const loadSavedPaymentMethods = async () => {
    try {
      const response = await paymentAPI.getSavedPaymentMethods();
      setSavedMethods(response.paymentMethods || []);
      if (response.paymentMethods?.length > 0) {
        setShowNewCard(false);
      }
    } catch (error) {
      console.error('Error loading saved payment methods:', error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess(null);

    if (!selectedProject) {
      setError('Please select a project');
      return;
    }

    setProcessing(true);

    try {
      if (selectedSavedMethod && !showNewCard) {
        await handleSavedMethodPayment();
      } else if (showNewCard) {
        await handleNewCardPayment();
      } else {
        setError('Please select a payment method');
        setProcessing(false);
        return;
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleNewCardPayment = async () => {
    if (!stripe || !elements) {
      setError('Stripe not loaded');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    
    if (!cardElement) {
      setError('Card information not found. Please enter your card details.');
      return;
    }

    // Create payment intent
    const paymentIntent = await paymentAPI.createPaymentIntent(
      selectedProject,
      2999,
      savePaymentMethod
    );

    // Confirm payment
    const result = await stripe.confirmCardPayment(paymentIntent.clientSecret, {
      payment_method: {
        card: cardElement,
      }
    });

    if (result.error) {
      setError(result.error.message);
    } else {
      if (result.paymentIntent.status === 'succeeded') {
        const successResult = await paymentAPI.handlePaymentSuccess(
          result.paymentIntent.id
        );
        setSuccess(successResult);
        // Reload saved methods if payment method was saved
        if (savePaymentMethod) {
          await loadSavedPaymentMethods();
        }
      }
    }
  };

  const handleSavedMethodPayment = async () => {
    const result = await paymentAPI.payWithSavedMethod(
      selectedProject,
      selectedSavedMethod,
      2999
    );

    if (result.success) {
      setSuccess(result);
    } else if (result.requiresAction) {
      // Handle 3D Secure - use confirmPayment instead of confirmCardPayment for saved methods
      const { error } = await stripe.confirmPayment({
        clientSecret: result.clientSecret,
        confirmParams: {
          return_url: window.location.origin + '/payment-return',
        },
      });
      
      if (error) {
        setError(error.message);
      } else {
        // Payment succeeded after authentication
        window.location.reload();
      }
    } else {
      setError(result.error || 'Payment failed');
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
    },
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.username}!</h2>
              <p className="text-gray-600 mt-1">Purchase a license key for your project</p>
            </div>
            <button 
              onClick={logout} 
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">🎉 Payment Successful!</h3>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-green-700">Your License Key:</p>
                <div className="bg-green-100 p-3 rounded-md font-mono text-sm text-green-800 mt-1">
                  {success.license.licenseKey}
                </div>
              </div>
              <p className="text-green-700"><span className="font-medium">Project:</span> {success.license.project}</p>
              <p className="text-green-700"><span className="font-medium">Features:</span> {success.license.features.join(', ')}</p>
              <p className="text-green-700"><span className="font-medium">Payment ID:</span> {success.paymentDetails.id}</p>
            </div>
          </div>
        )}

        {/* Payment Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Selection */}
            <div>
              <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-2">
                Select Project:
              </label>
              <select
                id="project"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                required
                disabled={processing}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
              >
                <option value="">Choose a project...</option>
                {projects.map((project) => (
                  <option key={project.value} value={project.value}>
                    {project.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-indigo-900">$29.99 USD</div>
            </div>

            {/* Saved Payment Methods */}
            {savedMethods.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Saved Payment Methods</h4>
                <div className="space-y-2">
                  {savedMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedSavedMethod === method.id 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedSavedMethod(method.id);
                        setShowNewCard(false);
                        setError(''); // Clear any previous errors
                      }}
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {method.card.brand.toUpperCase()} **** {method.card.last4}
                        </div>
                        <div className="text-sm text-gray-500">
                          Expires {method.card.exp_month}/{method.card.exp_year}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                  onClick={() => {
                    setSelectedSavedMethod(null);
                    setShowNewCard(true);
                    setError(''); // Clear any previous errors
                  }}
                >
                  Use New Card
                </button>
              </div>
            )}

            {/* New Card Section */}
            {showNewCard && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Details:
                  </label>
                  <div className="border border-gray-300 rounded-md p-3 bg-white">
                    <CardElement options={cardElementOptions} />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="savePaymentMethod"
                    checked={savePaymentMethod}
                    onChange={(e) => setSavePaymentMethod(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="savePaymentMethod" className="ml-2 block text-sm text-gray-700">
                    Save payment method for future purchases
                  </label>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!stripe || processing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Purchase License - $29.99'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Payment;
