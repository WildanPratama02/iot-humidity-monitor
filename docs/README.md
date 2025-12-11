# IoT Humidity Monitoring Dashboard

Dashboard Next.js untuk monitoring suhu dan kelembaban dari perangkat IoT ESP8266 + DHT22.

## 🚀 Features

- **Real-time Monitoring**: Auto-refresh data setiap 5 detik
- **Multi-location Support**: Monitor 28 lokasi dengan 30 device
- **Interactive Charts**: Visualisasi suhu dan kelembaban dengan threshold lines
- **Responsive Design**: Optimized untuk desktop dan tablet
- **Search & Filter**: Cari lokasi dengan mudah
- **Status Indicators**: Threshold warnings untuk suhu (>25°C) dan kelembaban (>60%)

## 🛠 Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Icons**: Lucide React
- **State Management**: TanStack Query (React Query)
- **Charts**: Recharts
- **HTTP Client**: Axios

## 📋 Prerequisites

- Node.js 18+ installed
- Backend API running on `http://192.168.43.175:8090`

## 🏃‍♂️ Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://192.168.43.175:8090
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Main dashboard page
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── providers/        # React Query provider
│   ├── Sidebar.tsx       # Location sidebar with search
│   ├── DeviceCard.tsx    # Device monitoring card with charts
│   └── DeviceGrid.tsx    # Grid layout for multiple devices
├── hooks/                # Custom React hooks
│   └── useIoTData.ts     # Data fetching hooks
├── lib/                  # Utility libraries
│   └── axios.ts          # API client configuration
└── types/                # TypeScript type definitions
    └── api.ts           # API response types
```

## 🔌 API Integration

The dashboard integrates with your existing Express.js backend:

- **GET /devices**: Fetch all devices (flat list)
- **GET /data/:id_device**: Fetch sensor history for specific device

## 📊 Dashboard Features

### Sidebar
- Lists all 28 locations
- Search functionality to filter locations
- Active location indicator
- Device count per location

### Device Cards
- Current temperature and humidity display
- Historical data visualization
- Temperature chart with 25°C threshold line
- Humidity chart with 60% threshold line
- Last update timestamp
- Real-time data refresh (5-second interval)

### Responsive Grid
- Dynamic grid layout based on device count
- 1 device: Full width
- 2 devices: 2 columns
- 3+ devices: 3 columns

## 🎨 Customization

### Changing Thresholds
Update the threshold values in `DeviceCard.tsx`:

```typescript
// Temperature threshold
<ReferenceLine
  y={25}  // Change this value
  stroke="#ef4444"
  strokeDasharray="5 5"
  label={{ value: "Max (25°C)", position: "topRight", fontSize: 10 }}
/>

// Humidity threshold
<ReferenceLine
  y={60}  // Change this value
  stroke="#3b82f6"
  strokeDasharray="5 5"
  label={{ value: "Max (60%)", position: "topRight", fontSize: 10 }}
/>
```

### API Endpoint Configuration
Update the API URL in:
1. `.env.local` file
2. `src/lib/axios.ts` (fallback value)

### Auto-refresh Interval
Change the polling interval in `src/hooks/useIoTData.ts`:

```typescript
refetchInterval: 5000, // Change to desired interval in milliseconds
```

## 🚀 Build & Deploy

1. **Build for production**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.