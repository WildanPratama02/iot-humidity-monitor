"use client";

import { DeviceStatusInfo } from '@/hooks/useDeviceStatus';

interface StatusIndicatorProps {
  statusInfo: DeviceStatusInfo;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * StatusIndicator Component
 * Displays a colored dot indicator with optional text label for device status.
 */
export function StatusIndicator({ 
  statusInfo, 
  showLabel = false,
  size = 'sm' 
}: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
  };

  const dotSize = sizeClasses[size];
  const isActive = statusInfo.status === 'active';

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <div 
          className={`${dotSize} rounded-full ${statusInfo.dotColorClass}`}
        />
        {/* Pulse animation for active status */}
        {isActive && (
          <div 
            className={`absolute inset-0 ${dotSize} rounded-full ${statusInfo.dotColorClass} animate-ping opacity-75`}
          />
        )}
      </div>
      {showLabel && (
        <span className={`text-xs font-medium ${statusInfo.colorClass}`}>
          {statusInfo.label}
        </span>
      )}
    </div>
  );
}

/**
 * StatusBadge Component
 * A larger badge-style status indicator for headers.
 */
export function StatusBadge({ statusInfo }: { statusInfo: DeviceStatusInfo }) {
  const bgColorClass = statusInfo.status === 'active' 
    ? 'bg-green-100' 
    : 'bg-red-100';

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bgColorClass}`}>
      <div className="relative">
        <div className={`h-2 w-2 rounded-full ${statusInfo.dotColorClass}`} />
        {statusInfo.status === 'active' && (
          <div 
            className={`absolute inset-0 h-2 w-2 rounded-full ${statusInfo.dotColorClass} animate-ping opacity-75`}
          />
        )}
      </div>
      <span className={`text-xs font-medium ${statusInfo.colorClass}`}>
        {statusInfo.label}
      </span>
    </div>
  );
}
