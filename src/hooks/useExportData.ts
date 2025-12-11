import { useState } from 'react';
import { api } from '@/lib/axios';
import { SensorDataFromAPI, DeviceFromAPI } from '@/types/api';

interface FetchDataParams {
  deviceIds: string[];
  startDate: string;
  endDate: string;
}

export const useExportData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDataForDateRange = async ({
    deviceIds,
    startDate,
    endDate,
  }: FetchDataParams): Promise<SensorDataFromAPI[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch data for each device
      const promises = deviceIds.map(async (deviceId) => {
        const { data } = await api.get(`/data/${deviceId}`, {
          params: {
            start_date: startDate,
            end_date: endDate,
          },
        });
        return data as SensorDataFromAPI[];
      });

      const results = await Promise.all(promises);
      const allData = results.flat();

      // Filter data by date range (backend might not support filtering)
      const filteredData = allData.filter((item) => {
        const itemDate = new Date(item.datetime).toISOString().split('T')[0];
        return itemDate >= startDate && itemDate <= endDate;
      });

      setIsLoading(false);
      return filteredData;
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      return [];
    }
  };

  const fetchAllDevicesData = async (
    devices: DeviceFromAPI[],
    startDate: string,
    endDate: string
  ) => {
    const deviceIds = devices.map((device) => device.id_device);
    return fetchDataForDateRange({ deviceIds, startDate, endDate });
  };

  return {
    fetchDataForDateRange,
    fetchAllDevicesData,
    isLoading,
    error,
  };
};