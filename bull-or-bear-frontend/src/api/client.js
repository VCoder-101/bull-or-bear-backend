import axios from 'axios';
import { logError } from '../utils/logger';

const api = axios.create({
  baseURL: '/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    logError('axios', error);
    const original = error.config;

    // Не перехватываем 401 от эндпоинтов аутентификации
    const isAuthEndpoint = original.url?.includes('/auth/login/') ||
                           original.url?.includes('/auth/register/') ||
                           original.url?.includes('/auth/verify/');

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');

      if (refresh) {
        try {
          const { data } = await axios.post(
            '/api/v1/auth/token/refresh/',
            { refresh }
          );
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          // refresh failed — logout
        }
      }

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
