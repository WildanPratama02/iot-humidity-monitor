"use client";

import { useState } from 'react';
import { Download, Calendar, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLocationsAndDevices } from '@/hooks/useIoTData';
import { useExportData } from '@/hooks/useExportData';
import { exportData, ExportFormat, ExportData } from '@/lib/export';
import { LocationGroup } from '@/types/api';

interface ExportDialogProps {
  children?: React.ReactNode;
}

export function ExportDialog({ children }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  const { data: locations } = useLocationsAndDevices();
  const { fetchAllDevicesData, isLoading, error } = useExportData();

  const handleExport = async () => {
    if (!locations) return;

    let start = startDate;
    let end = endDate;

    // Calculate date range based on selection
    if (dateRange !== 'custom') {
      const now = new Date();
      
      // Helper to format date as YYYY-MM-DD in local timezone (not UTC)
      const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      switch (dateRange) {
        case 'today':
          start = end = formatLocalDate(now);
          break;
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          start = formatLocalDate(weekAgo);
          end = formatLocalDate(now);
          break;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          start = formatLocalDate(monthAgo);
          end = formatLocalDate(now);
          break;
      }
      
      console.log(`[Export Debug] Date range: ${dateRange}, start: ${start}, end: ${end}`);
    }

    if (!start || !end) {
      alert('Please select a valid date range');
      return;
    }

    // Get devices to export
    let devicesToExport: LocationGroup[] = [];
    if (selectedLocation === 'all') {
      devicesToExport = locations;
    } else {
      const location = locations.find((loc) => loc.locationName === selectedLocation);
      if (location) {
        devicesToExport = [location];
      }
    }

    // Flatten all devices
    const allDevices = devicesToExport.flatMap((loc) => loc.devices);

    // Fetch data for date range
    const sensorData = await fetchAllDevicesData(allDevices, start, end);

    if (sensorData.length === 0) {
      alert('No data found for the selected date range');
      return;
    }

    // Group data by device (trim IDs to handle whitespace differences)
    const exportDataArray: ExportData[] = devicesToExport.map((location) => ({
      deviceId: location.devices.map((d) => d.id_device.trim()).join(', '),
      deviceLocation: location.locationName,
      data: sensorData.filter((item) =>
        location.devices.some((device) => device.id_device.trim() === item.id_device.trim())
      ),
    }));

    // Export data
    await exportData(
      exportDataArray,
      exportFormat,
      `iot-data-${selectedLocation === 'all' ? 'all-locations' : selectedLocation}`
    );

    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export IoT Sensor Data</DialogTitle>
          <DialogDescription>
            Export sensor data for selected devices within a date range
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Location Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Location
            </Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations?.map((location) => (
                  <SelectItem key={location.locationName} value={location.locationName}>
                    {location.locationName} ({location.devices.length} devices)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Date Range</Label>
            <RadioGroup
              value={dateRange}
              onValueChange={(value: any) => setDateRange(value)}
              className="col-span-3 flex flex-col gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="today" id="today" />
                <Label htmlFor="today">Today</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="week" id="week" />
                <Label htmlFor="week">Last 7 Days</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="month" id="month" />
                <Label htmlFor="month">Last 30 Days</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom">Custom Range</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endDate" className="text-right">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </>
          )}

          {/* Export Format */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Format</Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={(value: ExportFormat) => setExportFormat(value)}
              className="col-span-3 flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel (.xlsx)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  CSV (.csv)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 text-center">
            Error: {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isLoading}>
            {isLoading ? (
              <span className="animate-pulse">Exporting...</span>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}