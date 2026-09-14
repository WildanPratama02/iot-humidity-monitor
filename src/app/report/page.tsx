"use client";

import { useState, useRef, useMemo, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  Download, 
  FileSpreadsheet, 
  Camera, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Droplets,
  Thermometer,
  Activity,
  ArrowLeft,
  RefreshCw,
  ChevronDown,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuthGuard } from '@/components/AuthGuard';
import { useLocationsAndDevices } from '@/hooks/useIoTData';
import { useReportData, ReportFilters } from '@/hooks/useReportData';
import { ReportChart, ReportChartHandle } from '@/components/charts/ReportChart';
import { exportData, ExportData } from '@/lib/export';
import Link from 'next/link';
import { jsPDF } from 'jspdf';

function ReportContent() {
  // Refs for chart screenshots
  const humidityChartRef = useRef<ReportChartHandle>(null);
  const temperatureChartRef = useRef<ReportChartHandle>(null);
  const chartsContainerRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Default to yesterday
  const yesterday = subDays(new Date(), 1);
  
  // State for filters
  const [selectedDate, setSelectedDate] = useState(format(yesterday, 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('18:00');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  // Data hooks
  const { data: locations } = useLocationsAndDevices();
  const { reportData, fetchReportData, isLoading, error, clearReport } = useReportData();

  // Get devices based on selected location
  const selectedDevices = useMemo(() => {
    if (!locations) return [];
    if (selectedLocation === 'all') {
      return locations.flatMap(l => l.devices);
    }
    const loc = locations.find(l => l.locationName === selectedLocation);
    return loc?.devices || [];
  }, [locations, selectedLocation]);

  // Fetch report when Generate is clicked
  const handleGenerateReport = async () => {
    if (selectedDevices.length === 0) return;
    
    const filters: ReportFilters = {
      date: selectedDate,
      startTime,
      endTime,
    };
    
    await fetchReportData(selectedDevices, filters);
  };

  // Download screenshots
  const handleDownloadHumidityChart = () => {
    humidityChartRef.current?.downloadPNG();
  };

  const handleDownloadTemperatureChart = () => {
    temperatureChartRef.current?.downloadPNG();
  };

  const handleDownloadAllCharts = () => {
    humidityChartRef.current?.downloadPNG();
    setTimeout(() => {
      temperatureChartRef.current?.downloadPNG();
    }, 500);
  };

  // Download PDF with all charts - Using Highcharts SVG export (bypasses CSS)
  const handleDownloadPDF = async () => {
    if (!chartsContainerRef.current || !reportData) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      
      // Add header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Daily Report - Monitoring Kelembaban', margin, 20);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Tanggal: ${formattedDate}`, margin, 28);
      pdf.text(`Periode: ${startTime} - ${endTime} WIB`, margin, 34);
      pdf.text(`Lokasi: ${selectedLocation === 'all' ? 'Semua Lokasi' : selectedLocation}`, margin, 40);
      pdf.text(`Device Aktif: ${activeDevicesCount} dari ${selectedDevices.length} unit`, margin, 46);
      
      let yPosition = 55;
      
      // Helper function to convert SVG to PNG data URL
      const svgToPng = (svgElement: SVGSVGElement, width: number, height: number): Promise<string> => {
        return new Promise((resolve, reject) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          canvas.width = width * 2; // Higher resolution
          canvas.height = height * 2;
          ctx.scale(2, 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          
          // Serialize SVG
          const svgData = new XMLSerializer().serializeToString(svgElement);
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load SVG image'));
          };
          img.src = url;
        });
      };
      
      // Process each device
      for (const device of selectedDevices) {
        const deviceData = reportData.data.filter(
          item => item.id_device.trim() === device.id_device.trim()
        );
        
        if (deviceData.length === 0) continue;
        
        // Calculate stats for this device
        const humidities = deviceData.map(d => parseFloat(d.hum.toString()));
        const temps = deviceData.map(d => parseFloat(d.temp.toString()));
        const avgHum = humidities.reduce((a, b) => a + b, 0) / humidities.length;
        const maxHum = Math.max(...humidities);
        const minHum = Math.min(...humidities);
        const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
        const maxTemp = Math.max(...temps);
        const minTemp = Math.min(...temps);
        const alertCount = humidities.filter(h => h > 60).length;
        
        // Check if we need a new page for device header
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = margin;
        }
        
        // Add device header
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(31, 41, 55); // gray-800
        pdf.text(`${device.location} (${device.id_device})`, margin, yPosition);
        yPosition += 5;
        
        // Add detail location if available
        if (device.detil_location) {
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(107, 114, 128); // gray-500
          pdf.text(device.detil_location, margin, yPosition);
          yPosition += 4;
        }
        
        // Add stats line
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(75, 85, 99); // gray-600
        const statsLine = `Kelembaban: Avg ${avgHum.toFixed(1)}% | Max ${maxHum.toFixed(1)}% | Min ${minHum.toFixed(1)}% | Alert: ${alertCount}  |  Suhu: Avg ${avgTemp.toFixed(1)}°C | Max ${maxTemp.toFixed(1)}°C | Min ${minTemp.toFixed(1)}°C`;
        pdf.text(statsLine, margin, yPosition);
        yPosition += 8;
        
        // Reset text color
        pdf.setTextColor(0, 0, 0);
        
        // Get charts for this device (2 charts per device: humidity and temperature)
        const deviceCard = chartsContainerRef.current?.querySelector(`[data-device-id="${device.id_device}"]`);
        if (deviceCard) {
          const chartContainers = deviceCard.querySelectorAll('.highcharts-container');
          
          for (let i = 0; i < chartContainers.length; i++) {
            const container = chartContainers[i] as HTMLElement;
            const svg = container.querySelector('svg');
            
            if (!svg) continue;
            
            const svgClone = svg.cloneNode(true) as SVGSVGElement;
            
            // Get dimensions
            const rect = svg.getBoundingClientRect();
            const width = rect.width || 500;
            const height = rect.height || 200;
            
            // Set explicit dimensions on cloned SVG
            svgClone.setAttribute('width', width.toString());
            svgClone.setAttribute('height', height.toString());
            
            // Add white background
            const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bgRect.setAttribute('width', '100%');
            bgRect.setAttribute('height', '100%');
            bgRect.setAttribute('fill', '#ffffff');
            svgClone.insertBefore(bgRect, svgClone.firstChild);
            
            try {
              const imgData = await svgToPng(svgClone, width, height);
              const imgWidth = contentWidth / 2 - 2; // Two charts side by side
              const imgHeight = (height * imgWidth) / width;
              
              // Check if we need a new page
              if (yPosition + imgHeight > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin;
              }
              
              // Position: first chart on left, second on right
              const xPos = i % 2 === 0 ? margin : margin + contentWidth / 2 + 2;
              pdf.addImage(imgData, 'PNG', xPos, yPosition, imgWidth, imgHeight);
              
              // Move to next row after second chart
              if (i % 2 === 1) {
                yPosition += imgHeight + 5;
              }
            } catch (err) {
              console.warn('Failed to export chart', i, err);
            }
          }
          
          // If odd number of charts, still move down
          if (chartContainers.length % 2 === 1) {
            const svg = chartContainers[0]?.querySelector('svg');
            const rect = svg?.getBoundingClientRect();
            const height = rect?.height || 200;
            const imgWidth = contentWidth / 2 - 2;
            const imgHeight = (height * imgWidth) / (rect?.width || 500);
            yPosition += imgHeight + 5;
          }
        }
        
        // Add separator line
        yPosition += 5;
        pdf.setDrawColor(229, 231, 235); // gray-200
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
      }
      
      // Save the PDF
      pdf.save(`daily-report-${selectedDate}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Gagal membuat PDF: ${errorMessage}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    if (!reportData || !locations) return;

    let locationsToExport = locations;
    if (selectedLocation !== 'all') {
      locationsToExport = locations.filter(l => l.locationName === selectedLocation);
    }

    const exportDataArray: ExportData[] = locationsToExport.map(location => ({
      deviceId: location.devices.map(d => d.id_device.trim()).join(', '),
      deviceLocation: location.locationName,
      data: reportData.data.filter(item =>
        location.devices.some(device => device.id_device.trim() === item.id_device.trim())
      ),
    }));

    await exportData(
      exportDataArray,
      'excel',
      `daily-report-${selectedDate}`
    );
  };

  // Calculate active devices (devices with data)
  const activeDevicesCount = useMemo(() => {
    if (!reportData) return 0;
    const uniqueDevices = new Set(
      reportData.data.map(item => item.id_device.trim())
    );
    return uniqueDevices.size;
  }, [reportData]);

  // Format date for display
  const formattedDate = useMemo(() => {
    try {
      return format(new Date(selectedDate), 'EEEE, d MMMM yyyy', { locale: id });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Daily Report
                </h1>
                <p className="text-sm text-gray-500">
                  Generate laporan harian monitoring kelembaban
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Filter Section */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Filter Report
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Tanggal
              </Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  clearReport();
                }}
                max={format(yesterday, 'yyyy-MM-dd')}
              />
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Jam Mulai
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  clearReport();
                }}
              />
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <Label htmlFor="endTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Jam Selesai
              </Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  clearReport();
                }}
              />
            </div>

            {/* Location Selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Lokasi
              </Label>
              <Select 
                value={selectedLocation} 
                onValueChange={(value) => {
                  setSelectedLocation(value);
                  clearReport();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih lokasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Lokasi</SelectItem>
                  {locations?.map((location) => (
                    <SelectItem key={location.locationName} value={location.locationName}>
                      {location.locationName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate Button */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button 
              onClick={handleGenerateReport} 
              disabled={isLoading || selectedDevices.length === 0}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Memuat...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>

            {reportData && reportData.data.length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleExportExcel}
                  className="gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export Excel
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="gap-2"
                >
                  {isGeneratingPDF ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Membuat PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* Report Content */}
        {reportData && (
          <>
            {/* Report Info Banner */}
            <Card className="p-4 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Laporan Harian Monitoring Kelembaban
                  </h3>
                  <p className="text-gray-600">
                    {formattedDate} | {startTime} - {endTime} WIB
                  </p>
                  <p className="text-sm text-gray-500">
                    Lokasi: {selectedLocation === 'all' ? 'Semua Lokasi' : selectedLocation}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Device Aktif: {activeDevicesCount} dari {selectedDevices.length} unit
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Data</p>
                  <p className="text-2xl font-bold text-blue-600">{reportData.totalRecords}</p>
                </div>
              </div>
            </Card>

            {/* No Data Message */}
            {reportData.data.length === 0 ? (
              <Card className="p-8 text-center">
                <Droplets className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700">Tidak Ada Data</h3>
                <p className="text-gray-500">
                  Tidak ditemukan data untuk filter yang dipilih.
                </p>
              </Card>
            ) : (
              <>
                {/* Charts Section - Per Device */}
                <div className="space-y-8" ref={chartsContainerRef}>
                  {/* Group data by device */}
                  {selectedDevices.map((device) => {
                    const deviceData = reportData.data.filter(
                      item => item.id_device.trim() === device.id_device.trim()
                    );
                    
                    if (deviceData.length === 0) return null;

                    // Calculate stats for this device
                    const humidities = deviceData.map(d => parseFloat(d.hum.toString()));
                    const temps = deviceData.map(d => parseFloat(d.temp.toString()));
                    const avgHum = humidities.reduce((a, b) => a + b, 0) / humidities.length;
                    const maxHum = Math.max(...humidities);
                    const minHum = Math.min(...humidities);
                    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
                    const maxTemp = Math.max(...temps);
                    const minTemp = Math.min(...temps);
                    const alertCount = humidities.filter(h => h > 60).length;

                    // Find times for max/min
                    const maxHumIdx = humidities.indexOf(maxHum);
                    const minHumIdx = humidities.indexOf(minHum);
                    const maxHumTime = new Date(deviceData[maxHumIdx].datetime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    const minHumTime = new Date(deviceData[minHumIdx].datetime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div key={device.id_device} className="space-y-2 mb-6" data-chart-card data-device-id={device.id_device}>
                        {/* Device Header + Stats - Single Row on Desktop */}
                        <div 
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                          style={{
                            backgroundColor: '#f9fafb',
                            borderColor: '#e5e7eb'
                          }}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            {/* Device Name */}
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center"
                                style={{ backgroundColor: '#dbeafe' }}
                              >
                                <Activity className="h-3 w-3 text-blue-600" color="#2563eb" />
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-gray-800" style={{ color: '#1f2937' }}>{device.location}</span>
                                  <span className="text-xs text-gray-400" style={{ color: '#9ca3af' }}>({device.id_device})</span>
                                </div>
                                {device.detil_location && (
                                  <span className="text-xs text-gray-500" style={{ color: '#6b7280' }}>{device.detil_location}</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Inline Stats */}
                            <div className="flex flex-wrap items-center gap-3 text-xs">
                              <div className="flex items-center gap-1">
                                <Droplets className="h-3 w-3 text-blue-500" color="#3b82f6" />
                                <span className="text-gray-500" style={{ color: '#6b7280' }}>Avg:</span>
                                <span className="font-semibold" style={{ color: '#111827' }}>{avgHum.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-red-500" color="#ef4444" />
                                <span className="text-gray-500" style={{ color: '#6b7280' }}>Max:</span>
                                <span className="font-semibold" style={{ color: '#111827' }}>{maxHum.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingDown className="h-3 w-3 text-green-500" color="#22c55e" />
                                <span className="text-gray-500" style={{ color: '#6b7280' }}>Min:</span>
                                <span className="font-semibold" style={{ color: '#111827' }}>{minHum.toFixed(1)}%</span>
                              </div>
                              <div className={`flex items-center gap-1 ${alertCount > 0 ? 'text-amber-600' : ''}`} style={{ color: alertCount > 0 ? '#d97706' : '#111827' }}>
                                <AlertTriangle className="h-3 w-3" color={alertCount > 0 ? '#d97706' : '#111827'} />
                                <span className="font-semibold">{alertCount}</span>
                              </div>
                              <span className="text-gray-300" style={{ color: '#d1d5db' }}>|</span>
                              <div className="flex items-center gap-1">
                                <Thermometer className="h-3 w-3 text-orange-500" color="#f97316" />
                                <span className="text-gray-500" style={{ color: '#6b7280' }}>Avg:</span>
                                <span className="font-semibold" style={{ color: '#111827' }}>{avgTemp.toFixed(1)}°C</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500" style={{ color: '#6b7280' }}>Max:</span>
                                <span className="font-semibold" style={{ color: '#111827' }}>{maxTemp.toFixed(1)}°C</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500" style={{ color: '#6b7280' }}>Min:</span>
                                <span className="font-semibold" style={{ color: '#111827' }}>{minTemp.toFixed(1)}°C</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Charts Grid - Side by Side */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                          <Card className="p-2">
                            <ReportChart
                              data={deviceData}
                              title={`Kelembaban - ${device.location} (${device.id_device})`}
                              type="humidity"
                              startTime={startTime}
                              endTime={endTime}
                              date={selectedDate}
                            />
                          </Card>
                          <Card className="p-2">
                            <ReportChart
                              data={deviceData}
                              title={`Suhu - ${device.location} (${device.id_device})`}
                              type="temperature"
                              startTime={startTime}
                              endTime={endTime}
                              date={selectedDate}
                            />
                          </Card>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Email Template Section */}
                <Card className="p-6 mt-6 bg-gray-50">
                  <h3 className="text-lg font-semibold mb-4">📧 Template Email Report</h3>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 font-mono text-sm">
                    <p className="font-bold mb-2">Subject: [QDMS] Daily Humidity Report - {formattedDate}</p>
                    <hr className="my-3" />
                    <p>Dear Mr. Jb Kim and Pak Mulyawan,</p>
                    <br />
                    <p>Berikut adalah Laporan Harian Monitoring Kelembaban untuk tanggal <strong>{formattedDate}</strong></p>
                    <p>Periode Monitoring: <strong>{startTime} - {endTime} WIB</strong></p>
                    <br />
                    <p className="font-bold">RINGKASAN:</p>
                    <p>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
                    <p>• Total Device: {selectedDevices.length} unit</p>
                    <p>• Device Aktif: {activeDevicesCount} unit | Device Tidak Aktif: {selectedDevices.length - activeDevicesCount} unit</p>
                    <p>• Rata-rata Kelembaban: {reportData.avgHumidity.toFixed(1)}%</p>
                    <p>• Kelembaban Tertinggi: {reportData.maxHumidity.toFixed(1)}% (Waktu: {reportData.maxHumidityTime})</p>
                    <p>• Kelembaban Terendah: {reportData.minHumidity.toFixed(1)}% (Waktu: {reportData.minHumidityTime})</p>
                    <p>• Alert/Peringatan: {reportData.alertCount} kejadian</p>
                    <p>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
                    <br />
                    <p className="font-bold">
                      STATUS KESELURUHAN: {reportData.alertCount === 0 ? '✅ NORMAL' : '⚠️ PERLU PERHATIAN'}
                    </p>
                    <br />
                    <p>Detail lengkap terlampir.</p>
                    <br />
                    <p>Best regards,</p>
                    <p>Wildan QIP</p>
                    <br />
                    <p className="text-gray-500">Attachment:</p>
                    <p className="text-gray-500">1. Daily_Report_{selectedDate}.xlsx</p>
                    <p className="text-gray-500">2. Chart_Humidity_{selectedDate}.png</p>
                    <p className="text-gray-500">3. Chart_Temperature_{selectedDate}.png</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="mt-4 gap-2"
                    onClick={() => {
                      const subject = encodeURIComponent(`[QDMS] Daily Humidity Report - ${formattedDate}`);
                      const body = encodeURIComponent(
`Dear Mr. Jb Kim and Pak Mulyawan,

Berikut adalah Laporan Harian Monitoring Kelembaban untuk tanggal ${formattedDate}
Periode Monitoring: ${startTime} - ${endTime} WIB

RINGKASAN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Total Device: ${selectedDevices.length} unit
• Device Aktif: ${activeDevicesCount} unit | Device Tidak Aktif: ${selectedDevices.length - activeDevicesCount} unit
• Rata-rata Kelembaban: ${reportData.avgHumidity.toFixed(1)}%
• Kelembaban Tertinggi: ${reportData.maxHumidity.toFixed(1)}% (Waktu: ${reportData.maxHumidityTime})
• Kelembaban Terendah: ${reportData.minHumidity.toFixed(1)}% (Waktu: ${reportData.minHumidityTime})
• Alert/Peringatan: ${reportData.alertCount} kejadian
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STATUS KESELURUHAN: ${reportData.alertCount === 0 ? '✅ NORMAL' : '⚠️ PERLU PERHATIAN'}

Detail lengkap terlampir.

Best regards,
Wildan QIP

Attachment:
1. Daily_Report_${selectedDate}.xlsx
2. Chart_Humidity_${selectedDate}.png
3. Chart_Temperature_${selectedDate}.png`
                      );
                      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                    }}
                  >
                    📧 Buka Email Client
                  </Button>
                </Card>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function ReportPage() {
  return (
    <AuthGuard>
      <ReportContent />
    </AuthGuard>
  );
}
