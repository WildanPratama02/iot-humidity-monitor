import ExcelJS from 'exceljs';
import { format, parseISO } from 'date-fns';
import { SensorDataFromAPI } from '@/types/api';

export type ExportFormat = 'excel' | 'csv';

export interface ExportData {
  deviceId: string;
  deviceLocation: string;
  data: SensorDataFromAPI[];
}

// Helper to safely parse datetime from various formats
const safeParseDatetime = (datetime: string): Date => {
  try {
    // Try parseISO first (for ISO format strings)
    const parsed = parseISO(datetime);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch {
    // Fall through to next method
  }

  // Fallback to native Date parsing (handles PostgreSQL formats)
  return new Date(datetime);
};

export const exportToExcel = async (data: ExportData[], fileName: string = 'export') => {
  console.log('[Export Debug] Starting Excel export, data:', data);

  // Create a new workbook
  const wb = new ExcelJS.Workbook();

  // Add a worksheet for each device
  data.forEach((device) => {
    console.log(`[Export Debug] Processing device ${device.deviceId}, records: ${device.data.length}`);

    const ws = wb.addWorksheet(`Device ${device.deviceId}`);

    // Define columns
    ws.columns = [
      { header: 'Device ID', key: 'deviceId', width: 15 },
      { header: 'Tanggal', key: 'tanggal', width: 12 },
      { header: 'Waktu', key: 'waktu', width: 10 },
      { header: 'Tanggal Lengkap', key: 'tanggalLengkap', width: 20 },
      { header: 'Suhu (°C)', key: 'suhu', width: 12 },
      { header: 'Kelembaban (%)', key: 'kelembaban', width: 15 },
      { header: 'Lokasi', key: 'lokasi', width: 20 },
    ];

    // Add rows
    device.data.forEach((item) => {
      const dateObj = safeParseDatetime(item.datetime);
      ws.addRow({
        deviceId: item.id_device,
        tanggal: format(dateObj, 'yyyy-MM-dd'),
        waktu: format(dateObj, 'HH:mm:ss'),
        tanggalLengkap: format(dateObj, 'yyyy-MM-dd HH:mm:ss'),
        suhu: item.temp,
        kelembaban: item.hum,
        lokasi: device.deviceLocation,
      });
    });

    // Style header row
    ws.getRow(1).font = { bold: true };
  });

  // Generate file name with timestamp
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  const fullFileName = `${fileName}_${timestamp}.xlsx`;

  // Generate buffer and download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fullFileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToCSV = (data: ExportData[], fileName: string = 'export') => {
  // Combine all device data into CSV string
  const headers = ['Device ID', 'Tanggal', 'Waktu', 'Tanggal Lengkap', 'Suhu (°C)', 'Kelembaban (%)', 'Lokasi'];
  const rows: string[] = [headers.join(',')];

  data.forEach((device) => {
    device.data.forEach((item) => {
      const dateObj = safeParseDatetime(item.datetime);
      const row = [
        item.id_device,
        format(dateObj, 'yyyy-MM-dd'),
        format(dateObj, 'HH:mm:ss'),
        format(dateObj, 'yyyy-MM-dd HH:mm:ss'),
        item.temp,
        item.hum,
        device.deviceLocation,
      ];
      rows.push(row.join(','));
    });
  });

  const csv = rows.join('\n');

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

export const exportData = async (
  data: ExportData[],
  formatType: ExportFormat,
  fileName: string = 'sensor-data'
) => {
  if (formatType === 'excel') {
    await exportToExcel(data, fileName);
  } else if (formatType === 'csv') {
    exportToCSV(data, fileName);
  }
};