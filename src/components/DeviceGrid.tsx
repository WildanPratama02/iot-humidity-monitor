import { DeviceFromAPI } from '@/types/api';
import { DeviceCard } from './DeviceCard';

interface DeviceGridProps {
  devices: DeviceFromAPI[];
}

export function DeviceGrid({ devices }: DeviceGridProps) {
  if (devices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
            />
          </svg>
          <p className="text-lg font-medium">Tidak ada device di lokasi ini</p>
          <p className="text-sm mt-1">Device yang tersedia akan muncul di sini</p>
        </div>
      </div>
    );
  }

  // Dynamic grid layout based on number of devices
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const gridClass = gridCols[devices.length as keyof typeof gridCols] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${gridClass} gap-6`}>
      {devices.map((device) => (
        <DeviceCard key={device.id_device} device={device} />
      ))}
    </div>
  );
}