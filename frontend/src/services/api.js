import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/users/login', { username, password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/users/logout');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  }
};

// Payment API
export const paymentAPI = {
  getStripeConfig: async () => {
    const response = await api.get('/payments/config');
    return response.data;
  },

  createPaymentIntent: async (projectName, amount = 2999, savePaymentMethod = false) => {
    const response = await api.post('/payments/create-payment-intent', {
      projectName,
      amount,
      savePaymentMethod
    });
    return response.data;
  },

  getSavedPaymentMethods: async () => {
    const response = await api.get('/payments/payment-methods');
    return response.data;
  },

  payWithSavedMethod: async (projectName, paymentMethodId, amount = 2999) => {
    const response = await api.post('/payments/pay-with-saved-method', {
      projectName,
      paymentMethodId,
      amount
    });
    return response.data;
  },

  handlePaymentSuccess: async (paymentIntentId) => {
    const response = await api.post('/payments/payment-success', {
      paymentIntentId
    });
    return response.data;
  }
};

export default api;
