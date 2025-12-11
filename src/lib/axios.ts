import axios from 'axios';
import { DeviceFromAPI, SensorDataFromAPI } from '@/types/api';

// Pastikan .env.local memiliki: NEXT_PUBLIC_API_URL=http://localhost:3000
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.43.175:8090';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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