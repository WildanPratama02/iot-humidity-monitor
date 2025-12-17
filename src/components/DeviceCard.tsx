"use client";

import { Thermometer, Droplets, Activity, MapPin, Info, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeviceFromAPI } from '@/types/api';
import { useDeviceHistory } from '@/hooks/useIoTData';
import { TemperatureChart } from './charts/TemperatureChart';
import { HumidityChart } from './charts/HumidityChart';

interface DeviceCardProps {
  device: DeviceFromAPI;
}

export function DeviceCard({ device }: DeviceCardProps) {
  const { data: historyData, isLoading, isError } = useDeviceHistory(device.id_device);

  if (isError) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Gagal memuat data device {device.id_device}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get latest reading for status
  const latestReading = historyData?.[historyData.length - 1];
  const lastUpdated = latestReading
    ? new Date(latestReading.datetime).toLocaleString('id-ID')
    : 'Belum ada data';

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Device {device.id_device}</span>
          </div>
          <div className="text-sm text-gray-500">
            {lastUpdated}
          </div>
        </CardTitle>
        
        {/* Device Details */}
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm text-gray-600">
          {device.detil_location && (
            <div className="grid grid-cols-[140px_auto] gap-2 items-center">
              <span className="font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-green-500" />
                Detail Location
              </span>
              <span>{device.detil_location}</span>
            </div>
          )}
          {device.mac_address && (
            <div className="grid grid-cols-[140px_auto] gap-2 items-center">
              <span className="font-medium flex items-center gap-2">
                <Wifi className="h-4 w-4 text-purple-500" />
                MAC Address
              </span>
              <span>{device.mac_address}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Status */}
        {latestReading && (
          <div className="grid grid-cols-2 gap-4">
            <div className={`${latestReading.temp > 25 ? 'bg-red-50' : 'bg-blue-50'} p-4 rounded-lg`}>
              <div className="flex items-center gap-2 mb-1">
                <Thermometer className={`h-4 w-4 ${latestReading.temp > 25 ? 'text-red-600' : 'text-blue-600'}`} />
                <span className="text-sm font-medium text-gray-700">Suhu</span>
              </div>
              <p className={`text-2xl font-bold ${latestReading.temp > 25 ? 'text-red-600' : 'text-blue-600'}`}>
                {latestReading.temp.toFixed(1)}°C
                {latestReading.temp > 25 && <span className="text-sm ml-2">⚠️</span>}
              </p>
            </div>
            <div className={`${latestReading.hum > 60 ? 'bg-red-50' : 'bg-green-50'} p-4 rounded-lg`}>
              <div className="flex items-center gap-2 mb-1">
                <Droplets className={`h-4 w-4 ${latestReading.hum > 60 ? 'text-red-600' : 'text-green-600'}`} />
                <span className="text-sm font-medium text-gray-700">Kelembaban</span>
              </div>
              <p className={`text-2xl font-bold ${latestReading.hum > 60 ? 'text-red-600' : 'text-green-600'}`}>
                {latestReading.hum.toFixed(1)}%
                {latestReading.hum > 60 && <span className="text-sm ml-2">⚠️</span>}
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Memuat data grafik...
          </div>
        ) : historyData && historyData.length > 0 ? (
          <>
            {/* Temperature Chart */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-blue-600" />
                Grafik Suhu (Hari Ini)
              </h3>
              <TemperatureChart data={historyData} />
            </div>

            {/* Humidity Chart */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Droplets className="h-4 w-4 text-green-600" />
                Grafik Kelembaban (Hari Ini)
              </h3>
              <HumidityChart data={historyData} />
            </div>
          </>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Belum ada data historis
          </div>
        )}
      </CardContent>
    </Card>
  );
}