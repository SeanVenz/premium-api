import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auth API
export const authAPI = {
  login: async (usernameOrEmail, password) => {
    // Determine if it's an email or username
    const loginData = usernameOrEmail.includes('@') 
      ? { email: usernameOrEmail, password }
      : { username: usernameOrEmail, password };
      
    const response = await api.post('/users/login', loginData);
    return response.data;
  },

  register: async (username, email, password) => {
    const response = await api.post('/users/register', { username, email, password });
    return response.data;
  },

  verifyEmail: async (token) => {
    const response = await api.get(`/users/verify/${token}`);
    return response.data;
  },

  resendVerification: async (email) => {
    const response = await api.post('/users/resend-verification', { email });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/users/logout');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/users/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, password, confirmPassword) => {
    const response = await api.post(`/users/reset-password/${token}`, { 
      password, 
      confirmPassword 
    });
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
