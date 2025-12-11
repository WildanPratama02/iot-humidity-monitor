"use client";

import { useState, useEffect, useMemo } from 'react';
import { useLocationsWithStatus } from '@/hooks/useIoTData';
import { useNotificationPermission, useAlertSystem } from '@/hooks/useAlertSystem';
import { getDeviceStatus, DeviceStatus } from '@/hooks/useDeviceStatus';
import { Sidebar } from '@/components/Sidebar';
import { DeviceGrid } from '@/components/DeviceGrid';
import { StatusBadge } from '@/components/StatusIndicator';
import { Menu, Search, MapPin, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ExportDialog } from '@/components/ExportDialog';
import { Footer } from '@/components/Footer';
import { SOPSection } from '@/components/SOPSection';
import { getLocationData } from '@/lib/locationData';
import { StatusIndicator } from '@/components/StatusIndicator';

type StatusFilter = 'all' | DeviceStatus;

export default function DashboardPage() {
  // Mengambil data lokasi yang sudah di-grouping dengan status
  const { data: locations, latestReadingsMap, isLoading, isError, error } = useLocationsWithStatus();

  // Request notification permission on app load
  useNotificationPermission();

  // State untuk menyimpan lokasi mana yang sedang aktif dilihat
  const [activeLocationName, setActiveLocationName] = useState<string | null>(null);

  // State untuk sidebar (mobile dan desktop)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Default: closed on mobile, open on desktop
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  // State untuk desktop sidebar visibility
  const [isDesktopSidebarVisible, setIsDesktopSidebarVisible] = useState(() => {
    // Default: open on desktop
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  // State untuk desktop sidebar search and filter
  const [desktopSearchTerm, setDesktopSearchTerm] = useState('');
  const [desktopStatusFilter, setDesktopStatusFilter] = useState<StatusFilter>('all');

  // Count locations by status for filter badges
  const statusCounts = useMemo(() => {
    if (!locations) return { all: 0, active: 0, off: 0 };
    const counts = { all: locations.length, active: 0, off: 0 };
    locations.forEach(location => {
      const status = getDeviceStatus(location.lastUpdated);
      if (status.status === 'active') counts.active++;
      else counts.off++;
    });
    return counts;
  }, [locations]);

  // Filter locations for desktop sidebar
  const filteredDesktopLocations = useMemo(() => {
    if (!locations) return [];
    let result = locations;

    // Filter by search term
    if (desktopSearchTerm.trim()) {
      const searchLower = desktopSearchTerm.toLowerCase().trim();
      result = result.filter(location =>
        location.locationName.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (desktopStatusFilter !== 'all') {
      result = result.filter(location => {
        const status = getDeviceStatus(location.lastUpdated);
        return status.status === desktopStatusFilter;
      });
    }

    return result;
  }, [locations, desktopSearchTerm, desktopStatusFilter]);

  // Loading State
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat Data IoT...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center text-red-500">
          <p className="text-lg font-semibold">Gagal mengambil data server</p>
          <p className="text-sm mt-2">{error?.message || 'Terjadi kesalahan'}</p>
        </div>
      </div>
    );
  }

  // Logic Default Selection: Jika belum ada yg dipilih, pilih lokasi pertama
  const currentSelection = activeLocationName || locations?.[0]?.locationName;

  // Cari data object lengkap berdasarkan nama lokasi yang dipilih
  const activeLocationData = locations?.find(
    (l) => l.locationName === currentSelection
  );

  // Get status info for the active location
  const activeStatusInfo = getDeviceStatus(activeLocationData?.lastUpdated);

  // Get SOP data for the selected location
  const sopLocationData = currentSelection ? getLocationData(currentSelection) : null;

  // Get latest sensor data for the active location's first device (for alerts)
  const firstDeviceId = activeLocationData?.devices[0]?.id_device;
  const latestSensorData = firstDeviceId ? latestReadingsMap[firstDeviceId] : null;

  return (
    <>
      {/* Alert System Integration */}
      <AlertSystemWrapper 
        sensorData={latestSensorData} 
        locationName={currentSelection || ''} 
      />
      
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Sidebar and Main Content Container */}
        <div className="flex flex-1">
          {/* Desktop Sidebar - Toggle with state */}
          {isDesktopSidebarVisible && (
            <div className="hidden lg:block lg:flex-shrink-0">
              <div className="w-80 h-screen bg-white border-r border-gray-200 flex flex-col fixed top-0 left-0 z-30">
                {/* Header with close button for desktop */}
                <div className="p-4 lg:p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg lg:text-xl font-bold text-gray-800">Lokasi Monitoring</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsDesktopSidebarVisible(false)}
                      className="hover:bg-gray-100"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Cari lokasi..."
                      value={desktopSearchTerm}
                      onChange={(e) => setDesktopSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {/* Status Filter Tabs */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setDesktopStatusFilter('all')}
                      className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        desktopStatusFilter === 'all'
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Semua ({statusCounts.all})
                    </button>
                    <button
                      onClick={() => setDesktopStatusFilter('active')}
                      className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        desktopStatusFilter === 'active'
                          ? 'bg-green-500 text-white'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      Active ({statusCounts.active})
                    </button>
                    <button
                      onClick={() => setDesktopStatusFilter('off')}
                      className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        desktopStatusFilter === 'off'
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
                    {filteredDesktopLocations.map((location) => {
                      const isActive = location.locationName === currentSelection;
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
                          onClick={() => setActiveLocationName(location.locationName)}
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

                    {filteredDesktopLocations.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">Lokasi tidak ditemukan</p>
                        {desktopSearchTerm && (
                          <p className="text-xs mt-1 text-gray-400">
                            Coba kata kunci lain atau hapus pencarian
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Export Button - Desktop Only */}
                <div className="p-3 lg:p-4 border-t border-gray-200 bg-gray-50">
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
                    <p>Total Lokasi: {locations?.length || 0}</p>
                    <p>Total Device: {locations?.reduce((acc, loc) => acc + loc.devices.length, 0) || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Sidebar - Fixed positioning */}
          <Sidebar
            locations={locations || []}
            activeLocation={currentSelection ?? null}
            onSelectLocation={setActiveLocationName}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          />

          {/* Main Content Area */}
          <main className={`flex-1 p-4 lg:p-6 overflow-y-auto transition-all duration-300 ${
            isDesktopSidebarVisible ? 'lg:ml-80' : ''
          }`}>
          {/* Main Title Section */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    IoT Humidity Monitor Dashboard
                  </h1>
                  <p className="text-gray-600 text-sm lg:text-base">
                    Real-time monitoring of temperature and humidity across multiple locations
                  </p>
                </div>
                <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live Monitoring</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Separator Line */}
          <div className="border-t border-gray-200 mb-6"></div>

          {/* Header with menu button */}
          <header className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              {/* Menu button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (window.innerWidth >= 1024) {
                    setIsDesktopSidebarVisible(!isDesktopSidebarVisible);
                  } else {
                    setIsSidebarOpen(!isSidebarOpen);
                  }
                }}
                className="hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
                    Lokasi: {currentSelection}
                  </h1>
                  {/* Status Badge */}
                  <StatusBadge statusInfo={activeStatusInfo} />
                </div>
                <p className="text-sm lg:text-base text-gray-500">
                  Total Device: {activeLocationData?.devices.length || 0}
                </p>
              </div>
              <ExportDialog>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  Export Data
                </Button>
              </ExportDialog>
            </div>
          </header>

          {/* Grid Visualisasi Chart */}
          {activeLocationData && (
            <DeviceGrid devices={activeLocationData.devices} />
          )}

          {/* Operational Section - SOP */}
          {sopLocationData && (
            <SOPSection locationData={sopLocationData} />
          )}
        </main>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}

/**
 * Wrapper component for alert system to handle hooks properly
 */
function AlertSystemWrapper({ 
  sensorData, 
  locationName 
}: { 
  sensorData: import('@/types/api').SensorDataFromAPI | null | undefined; 
  locationName: string;
}) {
  useAlertSystem(sensorData, locationName);
  return null;
}