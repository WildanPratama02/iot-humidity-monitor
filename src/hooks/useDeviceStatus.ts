/**
 * useDeviceStatus Hook
 * Determines device active/off status based on last updated timestamp.
 */

export type DeviceStatus = 'active' | 'off';

export interface DeviceStatusInfo {
  status: DeviceStatus;
  label: string;
  colorClass: string;
  dotColorClass: string;
}

/**
 * Calculate device status based on last updated time
 * - Active: < 30 minutes ago (green)
 * - Off: > 30 minutes ago or no data (red)
 */
export function getDeviceStatus(lastUpdated: string | Date | null | undefined): DeviceStatusInfo {
  if (!lastUpdated) {
    return {
      status: 'off',
      label: 'Off',
      colorClass: 'text-red-500',
      dotColorClass: 'bg-red-500',
    };
  }

  const lastUpdatedDate = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated;
  const now = new Date();
  const diffInMinutes = (now.getTime() - lastUpdatedDate.getTime()) / (1000 * 60);

  if (diffInMinutes <= 30) {
    return {
      status: 'active',
      label: 'Active',
      colorClass: 'text-green-500',
      dotColorClass: 'bg-green-500',
    };
  } else {
    return {
      status: 'off',
      label: 'Off',
      colorClass: 'text-red-500',
      dotColorClass: 'bg-red-500',
    };
  }
}

/**
 * Hook version for React components that need reactive status updates
 */
export function useDeviceStatus(lastUpdated: string | Date | null | undefined): DeviceStatusInfo {
  return getDeviceStatus(lastUpdated);
}
