"use client";

import { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, X, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExportDialog } from '@/components/ExportDialog';
import { LocationGroup } from '@/types/api';
import { StatusIndicator } from '@/components/StatusIndicator';
import { getDeviceStatus, DeviceStatus } from '@/hooks/useDeviceStatus';

type StatusFilter = 'all' | DeviceStatus;

interface SidebarProps {
  locations: LocationGroup[];
  activeLocation: string | null;
  onSelectLocation: (locationName: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function Sidebar({
  locations,
  activeLocation,
  onSelectLocation,
  isOpen = true,
  onToggle
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isDesktop, setIsDesktop] = useState(false);

  // Check if we're on desktop
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen && !isDesktop) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isDesktop]);

  // Filter locations based on search term and status filter
  const filteredLocations = useMemo(() => {
    let result = locations;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter(location =>
        location.locationName.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(location => {
        const status = getDeviceStatus(location.lastUpdated);
        return status.status === statusFilter;
      });
    }

    return result;
  }, [locations, searchTerm, statusFilter]);

  // Count locations by status for filter badges
  const statusCounts = useMemo(() => {
    const counts = { all: locations.length, active: 0, off: 0 };
    locations.forEach(location => {
      const status = getDeviceStatus(location.lastUpdated);
      if (status.status === 'active') counts.active++;
      else counts.off++;
    });
    return counts;
  }, [locations]);

  return (
    <>
      {/* Mobile Overlay - Removed */}

      {/* Mobile Sidebar */}
      <div className={`
        ${!isOpen ? '-translate-x-full' : 'translate-x-0'}
        fixed top-0 left-0 h-screen z-40 lg:hidden
        w-80 bg-white border-r border-gray-200 flex flex-col
        transition-transform duration-300 ease-in-out
      `}>
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg lg:text-xl font-bold text-gray-800">Lokasi Monitoring</h2>
          {/* Close button for mobile only */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="lg:hidden hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari lokasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* Status Filter Tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua ({statusCounts.all})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'active'
                ? 'bg-green-500 text-white'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            Active ({statusCounts.active})
          </button>
          <button
            onClick={() => setStatusFilter('off')}
            className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'off'
                ? 'bg-red-500 text-white'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            Off ({statusCounts.off})
          </button>
        </div>
      </div>

      {/* Location List */}
      <div className="flex-1 overflow-y-auto p-2 lg:p-4">
        <div className="space-y-2">
          {filteredLocations.map((location) => {
            const isActive = location.locationName === activeLocation;
            const deviceCount = location.devices.length;
            const statusInfo = getDeviceStatus(location.lastUpdated);

            return (
              <Card
                key={location.locationName}
                className={`p-3 lg:p-4 cursor-pointer transition-all hover:shadow-md ${
                  isActive
                    ? 'bg-blue-50 border-blue-200 shadow-sm'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  onSelectLocation(location.locationName);
                  // Auto-close sidebar on mobile after selection
                  if (window.innerWidth < 1024 && onToggle) {
                    onToggle();
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <MapPin
                      className={`h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0 ${
                        isActive ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm lg:text-base font-medium truncate ${
                          isActive ? 'text-blue-900' : 'text-gray-800'
                        }`}>
                          {location.locationName}
                        </h3>
                        <StatusIndicator statusInfo={statusInfo} size="sm" showLabel />
                      </div>
                      <p className="text-xs lg:text-sm text-gray-500">
                        {deviceCount} device{deviceCount > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {filteredLocations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Lokasi tidak ditemukan</p>
              {searchTerm && (
                <p className="text-xs mt-1 text-gray-400">
                  Coba kata kunci lain atau hapus pencarian
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Export Button - Mobile Only */}
      <div className="p-3 lg:p-4 border-t border-gray-200 bg-gray-50 lg:hidden">
        <ExportDialog>
          <Button variant="outline" className="w-full gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </ExportDialog>
      </div>

      {/* Footer Info */}
      <div className="p-3 lg:p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs lg:text-sm text-gray-600">
          <p>Total Lokasi: {locations.length}</p>
          <p>Total Device: {locations.reduce((acc, loc) => acc + loc.devices.length, 0)}</p>
        </div>
      </div>
      </div>
    </>
  );
}