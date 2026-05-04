// Tipe data mentah dari API (Sesuai tb_device)
export interface DeviceFromAPI {
  id_device: string;
  location: string;
  detil_location?: string;  // Detail lokasi (optional)
  mac_address?: string;     // MAC Address (optional)
}

// Tipe data mentah dari API (Sesuai tb_data)
export interface SensorDataFromAPI {
  id: number;
  id_device: string;
  temp: number; // float
  hum: number;  // float
  datetime: string; // ISO String / Timestamp
}

// Tipe data hasil transformasi untuk UI Sidebar (Grouping)
export interface LocationGroup {
  locationName: string;
  devices: DeviceFromAPI[];
  lastUpdated?: string; // ISO timestamp of last data received for this location
}

// Extended device info with latest sensor data
export interface DeviceWithLatestData extends DeviceFromAPI {
  latestReading?: SensorDataFromAPI;
}

// Tipe data untuk chart yang sudah ditambahkan formattedTime
export interface SensorDataWithFormattedTime extends SensorDataFromAPI {
  formattedTime: string;
}