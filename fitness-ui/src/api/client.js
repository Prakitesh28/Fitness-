import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://fitness-api.onrender.com';

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let queue = [];

const flushQueue = (token) => {
  queue.forEach((cb) => cb(token));
  queue = [];
};

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || originalRequest._retry) throw error;

    if (isRefreshing) {
      return new Promise((resolve) => {
        queue.push((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(client(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, null, {
        params: { refresh_token: refreshToken },
        withCredentials: true,
      });
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
      flushQueue(data.access_token);
      return client(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().logout();
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  }
);

export default client;
