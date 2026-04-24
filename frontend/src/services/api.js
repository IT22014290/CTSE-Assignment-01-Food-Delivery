import axios from 'axios';

const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const authServiceUrl = (import.meta.env.VITE_AUTH_SERVICE_URL || '').replace(/\/$/, '');
const restaurantServiceUrl = (import.meta.env.VITE_RESTAURANT_SERVICE_URL || '').replace(/\/$/, '');
const orderServiceUrl = (import.meta.env.VITE_ORDER_SERVICE_URL || '').replace(/\/$/, '');
const deliveryServiceUrl = (import.meta.env.VITE_DELIVERY_SERVICE_URL || '').replace(/\/$/, '');

const api = axios.create({
  baseURL: baseUrl
});

const resolveServiceBaseUrl = (url = '') => {
  if (url.startsWith('/auth')) return authServiceUrl;
  if (url.startsWith('/restaurants')) return restaurantServiceUrl;
  if (url.startsWith('/orders')) return orderServiceUrl;
  if (url.startsWith('/delivery')) return deliveryServiceUrl;
  return '';
};

api.interceptors.request.use((config) => {
  const requestUrl = config.url || '';
  const serviceBaseUrl = resolveServiceBaseUrl(requestUrl);

  if (serviceBaseUrl && !/^https?:\/\//i.test(requestUrl)) {
    config.url = `${serviceBaseUrl}${requestUrl}`;
    config.baseURL = undefined;
  }

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
