import axios from 'axios';
import { DeviceFromAPI, SensorDataFromAPI } from '@/types/api';

// Pastikan .env.local memiliki: NEXT_PUBLIC_API_URL=https://192.168.43.175:8090
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://192.168.43.175:8090';

const TOKEN_KEY = 'iot_auth_token';

export const api = axios.create({ 
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Attach JWT token to all requests
api.interceptors.request.use(
  (config) => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle on client side
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('iot_auth_user');

      // Redirect to login (only if not already on login page)
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Fetch semua device (Flat List)
export const fetchDevices = async (): Promise<DeviceFromAPI[]> => {
  const { data } = await api.get('/devices');
  return data;
};

// Fetch history data untuk satu device specific
export const fetchDeviceHistory = async (deviceId: string): Promise<SensorDataFromAPI[]> => {
  const { data } = await api.get(`/data/${deviceId}`);
  return data;
};

// Fetch latest reading for a device (single record)
export const fetchLatestReading = async (deviceId: string): Promise<SensorDataFromAPI | null> => {
  const { data } = await api.get(`/data/${deviceId}`);
  // API returns DESC order, so first item is latest
  return data?.[0] || null;
};
