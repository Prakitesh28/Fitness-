import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://fitness-zodb.onrender.com';

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Keepalive ping system to prevent Render cold starts
let keepaliveInterval = null;

const startKeepalive = () => {
  // Clear any existing interval
  if (keepaliveInterval) {
    clearInterval(keepaliveInterval);
  }

  // Ping every 10 minutes (600000ms)
  keepaliveInterval = setInterval(async () => {
    try {
      await client.get('/health');
    } catch (error) {
      // Silently fail - keepalive is best effort
    }
  }, 600000);

  // Initial ping
  client.get('/health').catch(() => {});
};

const stopKeepalive = () => {
  if (keepaliveInterval) {
    clearInterval(keepaliveInterval);
    keepaliveInterval = null;
  }
};

// Start keepalive when the module loads (in a React context, we'll start it in main.jsx)
let isKeepaliveStarted = false;

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

// Function to manually start keepalive (to be called from main.jsx)
export const startKeepalivePing = () => {
  if (!isKeepaliveStarted) {
    startKeepalive();
    isKeepaliveStarted = true;
  }
};

export const stopKeepalivePing = () => {
  stopKeepalive();
  isKeepaliveStarted = false;
};

export default client;
