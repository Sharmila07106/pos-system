import axios from 'axios';
import toast from 'react-hot-toast';

const isProd = import.meta.env.PROD;
const configuredApiUrl = import.meta.env.VITE_API_URL;

if (isProd && !configuredApiUrl) {
  console.error(
    '❌ StoreFlow Configuration Error: VITE_API_URL is missing in this production build.\n' +
    'Please configure VITE_API_URL=https://YOUR-BACKEND.onrender.com/api in your Vercel Project Environment Variables.'
  );
}

// In production, strictly use configuredApiUrl. In development, fallback to localhost:5090
const baseURL = configuredApiUrl || (isProd ? '' : 'http://localhost:5090/api');

const api = axios.create({
  baseURL,
});

// Request interceptor for auth token (checks localStorage or sessionStorage)
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Toast deduplication tracker to prevent identical stacked error toasts
const recentToastMessages = new Map();

function showFriendlyErrorToast(message) {
  if (!message) return;
  const now = Date.now();
  const lastTime = recentToastMessages.get(message) || 0;
  if (now - lastTime < 2500) {
    return; // Suppress duplicate message within 2.5s window
  }
  recentToastMessages.set(message, now);
  if (recentToastMessages.size > 50) {
    recentToastMessages.clear();
  }

  toast.error(message, { id: message });
}

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute =
      error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/register') ||
      error.config?.url?.includes('/auth/google') ||
      error.config?.url?.includes('/users/login');

    const message =
      error.response?.data?.message || error.message || 'Something went wrong';

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    } else if (!isAuthRoute && !error.config?.skipToast) {
      showFriendlyErrorToast(message);
    }

    return Promise.reject(error);
  }
);

export default api;
