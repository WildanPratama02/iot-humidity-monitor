import { useQuery, useQueries } from '@tanstack/react-query';
import { fetchDevices, fetchDeviceHistory, fetchLatestReading } from '@/lib/axios';
import { DeviceFromAPI, SensorDataFromAPI, LocationGroup, SensorDataWithFormattedTime } from '@/types/api';

/**
 * HOOK 1: useLocationsAndDevices
 * Mengambil daftar device dan mengubahnya menjadi struktur Group by Location
 * agar mudah dirender di Sidebar Menu.
 */
export const useLocationsAndDevices = () => {
  return useQuery({
    queryKey: ['devices'],
    queryFn: fetchDevices,
    staleTime: 1000 * 60, // Cache selama 1 menit (karena lokasi jarang berubah)
    select: (data: DeviceFromAPI[]): LocationGroup[] => {
      // Logic Grouping: Mengelompokkan array flat menjadi object berdasarkan 'location'
      const groupedMap = data.reduce((acc, device) => {
        const loc = device.location;
        if (!acc[loc]) {
          acc[loc] = [];
        }
        acc[loc].push(device);
        return acc;
      }, {} as Record<string, DeviceFromAPI[]>);

      // Convert Object kembali ke Array untuk dipetakan (map) di UI
      return Object.keys(groupedMap).map((locationName) => ({
        locationName,
        devices: groupedMap[locationName],
      }));
    },
  });
};

/**
 * HOOK 2: useDeviceHistory
 * Mengambil data sensor historis untuk satu device tertentu.
 * Melakukan polling setiap 5 detik untuk efek Real-time.
 */
export const useDeviceHistory = (deviceId: string) => {
  return useQuery({
    queryKey: ['device-history', deviceId],
    queryFn: () => fetchDeviceHistory(deviceId),
    enabled: !!deviceId, // Jangan fetch jika deviceId kosong
    refetchInterval: 5000, // Auto-refetch setiap 5 detik
    select: (data: SensorDataFromAPI[]): SensorDataWithFormattedTime[] => {
      // Data dari backend biasanya DESC (terbaru dulu).
      // Untuk Chart, kita butuh ASC (lama -> baru) dari kiri ke kanan.
      // Kita copy array ([...data]) lalu reverse agar immutable.
      return [...data].reverse().map((item) => ({
        ...item,
        // Format jam menit detik untuk X-Axis chart
        formattedTime: new Date(item.datetime).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
      }));
    },
  });
};

/**
 * HOOK 3: useLatestReadings
 * Mengambil data sensor terbaru untuk semua device sekaligus.
 * Berguna untuk menentukan status online/offline dan alert.
 */
export const useLatestReadings = (deviceIds: string[]) => {
  const queries = useQueries({
    queries: deviceIds.map((deviceId) => ({
      queryKey: ['latest-reading', deviceId],
      queryFn: () => fetchLatestReading(deviceId),
      enabled: !!deviceId,
      refetchInterval: 10000, // Refresh every 10 seconds
      staleTime: 5000,
    })),
  });

  // Build a map of deviceId -> latest reading
  const latestReadingsMap: Record<string, SensorDataFromAPI | null> = {};
  deviceIds.forEach((deviceId, index) => {
    latestReadingsMap[deviceId] = queries[index]?.data ?? null;
  });

  return {
    latestReadingsMap,
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
  };
};

/**
 * HOOK 4: useLocationsWithStatus
 * Combines locations with their latest readings for status calculation.
 */
export const useLocationsWithStatus = () => {
  const locationsQuery = useLocationsAndDevices();
  const deviceIds = locationsQuery.data?.flatMap(loc => loc.devices.map(d => d.id_device)) || [];
  const { latestReadingsMap, isLoading: readingsLoading } = useLatestReadings(deviceIds);

  // Enhance locations with lastUpdated
  const locationsWithStatus: LocationGroup[] | undefined = locationsQuery.data?.map(location => {
    // Find the most recent reading among all devices in this location
    let mostRecentTime: Date | null = null;

    for (const device of location.devices) {
      const reading = latestReadingsMap[device.id_device];
      if (reading?.datetime) {
        const readingTime = new Date(reading.datetime);
        if (!mostRecentTime || readingTime > mostRecentTime) {
          mostRecentTime = readingTime;
        }
      }
    }

    return {
      ...location,
      lastUpdated: mostRecentTime?.toISOString(),
    };
  });

  return {
    data: locationsWithStatus,
    latestReadingsMap,
    isLoading: locationsQuery.isLoading || readingsLoading,
    isError: locationsQuery.isError,
    error: locationsQuery.error,
  };
};