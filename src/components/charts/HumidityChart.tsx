"use client";

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { SensorDataWithFormattedTime } from '@/types/api';

interface HumidityChartProps {
  data: SensorDataWithFormattedTime[];
}

export function HumidityChart({ data }: HumidityChartProps) {
  // --- KONSTANTA SETTING ---
  const DOMAIN_MAX = 100; // Ujung Atas Grafik
  const DOMAIN_MIN = 30;  // Ujung Bawah Grafik
  const THRESHOLD = 60;   // Batas Ambang

  // 1. Filter Data Hari Ini
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayData = data.filter(item => {
    const itemDate = new Date(item.datetime);
    return itemDate >= today && itemDate < tomorrow;
  });

  // 2. Transform data untuk Highcharts
  const chartData = todayData.map(item => [
    new Date(item.datetime).getTime(), // Timestamp untuk x-axis
    parseFloat(item.hum.toString()) // Nilai humidity untuk y-axis
  ]);

  // 3. Set time range for today (00:00 - 24:00)
  const startOfDay = new Date(today);
  const endOfDay = new Date(tomorrow);

  // 4. Formatter untuk tooltip
  const formatTooltipDateTime = (timestamp: number): { date: string; time: string } => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("id-ID", {
        weekday: 'long',
        day: "numeric",
        month: "long",
        year: "numeric"
      }),
      time: date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      })
    };
  };

  // 5. Konfigurasi Highcharts
  const options: Highcharts.Options = {
    time: {
      // Menggunakan offset waktu browser user (Local Time) secara otomatis
        timezoneOffset: new Date().getTimezoneOffset()
    },

    chart: {
      type: 'line',
      height: 200, // Tambah tinggi chart
      backgroundColor: 'transparent',
      marginLeft: 55, // Margin kiri untuk Y axis
      marginBottom: 30, // Margin bawah untuk X axis title
      marginRight: 10,
      marginTop: 30,
      style: {
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }
    },

    title: {
      text: undefined
    },

    xAxis: {
      type: 'datetime',
      min: startOfDay.getTime(),
      max: endOfDay.getTime(),
      lineColor: '#9ca3af', // Tampilkan garis sumbu X
      tickColor: '#9ca3af', // Tampilkan tick marks
      tickWidth: 1,
      tickLength: 4,
      lineWidth: 1,
      gridLineWidth: 1, // Tampilkan grid line vertikal
      gridLineDashStyle: 'LongDash', // Style putus-putus
      gridLineColor: '#e5e7eb',
      tickInterval: 3 * 3600 * 1000, // Interval setiap 3 jam (10,800,000 ms)
      labels: {
        format: '{value:%H:%M}',
        style: {
          fontSize: '11px',
          color: '#374151',
          fontWeight: '500'
        },
        y: 20 // Jarak label dari sumbu
      },
      title: {
        text: 'Waktu',
        align: 'low', // Align ke bottom
        offset: 0,
        rotation: 0,
        y: 35, // Posisi title
        x: 0,
        reserveSpace: true,
        style: {
          fontSize: '12px',
          color: '#111827',
          fontWeight: '600'
        }
      },
      crosshair: {
        dashStyle: 'Dash',
        color: '#e5e7eb',
        width: 1
      }
    },

  
    legend: {
      enabled: false
    },

    credits: {
      enabled: false
    },

    tooltip: {
      backgroundColor: 'white',
      borderColor: '#e5e7eb',
      borderRadius: 8,
      shadow: {
        color: 'rgba(0, 0, 0, 0.1)',
        offsetX: 0,
        offsetY: 2,
        opacity: 0.5,
        width: 3
      },
      padding: 12,
      useHTML: true,
      formatter: function() {
        const point = this.points?.[0];
        if (!point || point.y === undefined) return '';

        const { date, time } = formatTooltipDateTime(point.x);
        const value = point.y;
        const isAbove = value >= THRESHOLD;

        return `
          <div class="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p class="text-sm font-semibold text-gray-800 mb-1">${date}</p>
            <p class="text-xs text-gray-600 mb-2">${time}</p>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full ${isAbove ? 'bg-red-500' : 'bg-green-500'}"></div>
              <p class="text-sm font-medium">
                <span class="font-bold ${isAbove ? 'text-red-600' : 'text-green-600'}">
                  ${value.toFixed(1)}%
                </span>
                <span class="text-gray-500 ml-1">
                  ${isAbove && value > THRESHOLD ? ' (⚠️ Above Max)' : ' (Normal)'}
                </span>
              </p>
            </div>
          </div>
        `;
      },
      shared: true
    },

    plotOptions: {
      line: {
        lineWidth: 2,
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: true,
              radius: 4,
              lineWidth: 0
            }
          }
        },
        states: {
          hover: {
            lineWidth: 2
          }
        },
        threshold: THRESHOLD,
        negativeColor: '#22c55e', // Hijau untuk nilai di bawah threshold
        color: '#ef4444' // Merah untuk nilai di atas threshold
      }
    },

    series: [{
      name: 'Humidity',
      type: 'line',
      data: chartData,
      connectNulls: false,
      marker: {
        enabled: false
      },
      zones: [{
        value: THRESHOLD,
        color: '#22c55e' // Hijau untuk nilai <= 60%
      }, {
        color: '#ef4444' // Merah untuk nilai > 60%
      }]
    }],

    yAxis: {
      min: DOMAIN_MIN,
      max: DOMAIN_MAX,
      tickAmount: 7, // Jumlah ticks yang diinginkan
      lineColor: '#9ca3af', // Tampilkan garis sumbu Y
      tickColor: '#9ca3af', // Tampilkan tick marks
      tickWidth: 1,
      tickLength: 4,
      lineWidth: 1,
      gridLineColor: '#e5e7eb',
      gridLineDashStyle: 'Dash',
      labels: {
        format: '{value}%',
        style: {
          fontSize: '11px',
          color: '#374151',
          fontWeight: '500'
        },
        x: -5, // Posisi label di sebelah kiri sumbu
        y: 3
      },
      title: {
        text: 'Kelembaban (%)',
        align: 'high',
        rotation: 0,
        y: -15,
        x: 60,
        offset: 10,
        reserveSpace: true,
        style: {
          fontSize: '12px',
          color: '#111827',
          fontWeight: '600'
        }
      },
      plotLines: [{
        value: THRESHOLD,
        color: '#ef4444',
        dashStyle: 'Dash',
        width: 2,
        zIndex: 5,
        label: {
          text: `STANDARD ${THRESHOLD}%`,
          align: 'left',
          rotation: 0,
          x: 5,
          y: -5,
          style: {
            color: '#ef4444',
            fontSize: '11px',
            fontWeight: '600'
          }
        }
      }]
    },
  };

  return (
    <div className="w-full p-2">
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        containerProps={{
          style: {
            width: '100%',
            height: '100%',
            minHeight: '220px'
          }
        }}
      />
    </div>
  );
}