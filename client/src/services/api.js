import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5090/api',
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
      // Don't pop global toast if the page already shows a dedicated error banner
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
