import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import { SensorDataFromAPI } from '@/types/api';

export type ExportFormat = 'excel' | 'csv';

export interface ExportData {
  deviceId: string;
  deviceLocation: string;
  data: SensorDataFromAPI[];
}

export const exportToExcel = (data: ExportData[], fileName: string = 'export') => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Add a worksheet for each device
  data.forEach((device) => {
    // Transform data for export
    const worksheetData = device.data.map((item) => ({
      'Device ID': item.id_device,
      'Tanggal': format(parseISO(item.datetime), 'yyyy-MM-dd'),
      'Waktu': format(parseISO(item.datetime), 'HH:mm:ss'),
      'Tanggal Lengkap': format(parseISO(item.datetime), 'yyyy-MM-dd HH:mm:ss'),
      'Suhu (°C)': item.temp,
      'Kelembaban (%)': item.hum,
      'Lokasi': device.deviceLocation,
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(worksheetData);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Device ID
      { wch: 12 }, // Tanggal
      { wch: 10 }, // Waktu
      { wch: 20 }, // Tanggal Lengkap
      { wch: 12 }, // Suhu
      { wch: 15 }, // Kelembaban
      { wch: 20 }, // Lokasi
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, `Device ${device.deviceId}`);
  });

  // Generate file name with timestamp
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  const fullFileName = `${fileName}_${timestamp}.xlsx`;

  // Save file
  XLSX.writeFile(wb, fullFileName);
};

export const exportToCSV = (data: ExportData[], fileName: string = 'export') => {
  // Combine all device data
  const allData: any[] = [];

  data.forEach((device) => {
    device.data.forEach((item) => {
      allData.push({
        'Device ID': item.id_device,
        'Tanggal': format(parseISO(item.datetime), 'yyyy-MM-dd'),
        'Waktu': format(parseISO(item.datetime), 'HH:mm:ss'),
        'Tanggal Lengkap': format(parseISO(item.datetime), 'yyyy-MM-dd HH:mm:ss'),
        'Suhu (°C)': item.temp,
        'Kelembaban (%)': item.hum,
        'Lokasi': device.deviceLocation,
      });
    });
  });

  // Convert to CSV
  const ws = XLSX.utils.json_to_sheet(allData);
  const csv = XLSX.utils.sheet_to_csv(ws);

  // Generate file name with timestamp
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  const fullFileName = `${fileName}_${timestamp}.csv`;

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fullFileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const exportData = (
  data: ExportData[],
  format: ExportFormat,
  fileName: string = 'sensor-data'
) => {
  if (format === 'excel') {
    exportToExcel(data, fileName);
  } else if (format === 'csv') {
    exportToCSV(data, fileName);
  }
};