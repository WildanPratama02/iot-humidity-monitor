"use client";

import { useRef, forwardRef, useImperativeHandle } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { SensorDataFromAPI } from '@/types/api';

interface ReportChartProps {
  data: SensorDataFromAPI[];
  title: string;
  type: 'humidity' | 'temperature';
  startTime: string;
  endTime: string;
  date: string;
}

export interface ReportChartHandle {
  downloadPNG: () => void;
}

export const ReportChart = forwardRef<ReportChartHandle, ReportChartProps>(
  ({ data, title, type, startTime, endTime, date }, ref) => {
    const chartRef = useRef<HighchartsReact.RefObject>(null);

    // Chart settings based on type
    const isHumidity = type === 'humidity';
    const THRESHOLD = isHumidity ? 60 : 25;
    const DOMAIN_MIN = isHumidity ? 30 : 15;
    const DOMAIN_MAX = isHumidity ? 100 : 40;
    const yAxisTitle = isHumidity ? 'Kelembaban (%)' : 'Suhu (°C)';
    const unit = isHumidity ? '%' : '°C';
    const dataKey = isHumidity ? 'hum' : 'temp';

    // Expose download function - will trigger alert to use context menu
    useImperativeHandle(ref, () => ({
      downloadPNG: () => {
        alert('Untuk download gambar grafik:\n\n1. Klik kanan pada grafik\n2. Pilih "Save image as..." atau\n3. Gunakan tombol menu (≡) di pojok kanan atas grafik jika tersedia');
      },
    }), []);

    // Parse date for time range
    const dateObj = new Date(date);
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startOfRange = new Date(dateObj);
    startOfRange.setHours(startHour, startMin, 0, 0);
    
    const endOfRange = new Date(dateObj);
    endOfRange.setHours(endHour, endMin, 0, 0);

    // Transform data for Highcharts
    const chartData = data.map(item => [
      new Date(item.datetime).getTime(),
      parseFloat(item[dataKey].toString())
    ]);

    // Formatter untuk tooltip
    const formatTooltipDateTime = (timestamp: number): { date: string; time: string } => {
      const d = new Date(timestamp);
      return {
        date: d.toLocaleDateString("id-ID", {
          weekday: 'long',
          day: "numeric",
          month: "long",
          year: "numeric"
        }),
        time: d.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        })
      };
    };

    const options: Highcharts.Options = {
      time: {
        timezoneOffset: new Date().getTimezoneOffset()
      },

      chart: {
        type: 'line',
        height: 200,
        backgroundColor: '#ffffff',
        marginLeft: 55,
        marginBottom: 35,
        marginRight: 10,
        marginTop: 30,
        style: {
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }
      },

      title: {
        text: title,
        style: {
          fontSize: '13px',
          fontWeight: '600',
          color: '#111827'
        }
      },

      subtitle: {
        text: `${date} | ${startTime} - ${endTime}`,
        style: {
          fontSize: '10px',
          color: '#6b7280'
        }
      },

      xAxis: {
        type: 'datetime',
        min: startOfRange.getTime(),
        max: endOfRange.getTime(),
        lineColor: '#9ca3af',
        tickColor: '#9ca3af',
        tickWidth: 1,
        tickLength: 4,
        lineWidth: 1,
        gridLineWidth: 1,
        gridLineDashStyle: 'LongDash',
        gridLineColor: '#e5e7eb',
        tickInterval: 2 * 3600 * 1000,
        labels: {
          format: '{value:%H:%M}',
          style: {
            fontSize: '10px',
            color: '#374151',
            fontWeight: '500'
          },
          y: 15
        },
        title: {
          text: undefined, // Removed redundant title
          style: {
             display: 'none'
          }
        },
        crosshair: {
          dashStyle: 'Dash',
          color: '#e5e7eb',
          width: 1
        }
      },

      yAxis: {
        min: DOMAIN_MIN,
        max: DOMAIN_MAX,
        tickAmount: 5, // Reduced ticks
        lineColor: '#9ca3af',
        tickColor: '#9ca3af',
        tickWidth: 1,
        tickLength: 4,
        lineWidth: 1,
        gridLineColor: '#e5e7eb',
        gridLineDashStyle: 'Dash',
        labels: {
          format: `{value}${unit}`,
          style: {
            fontSize: '10px',
            color: '#374151',
            fontWeight: '500'
          },
          x: -5,
          y: 3
        },
        title: {
          text: undefined // Removed redundant title
        },
        plotLines: [{
          value: THRESHOLD,
          color: '#ef4444',
          dashStyle: 'Dash',
          width: 2,
          zIndex: 5,
          label: {
            text: `BATAS ${THRESHOLD}${unit}`,
            align: 'right', // Changed to right to avoid overlap
            x: -5,
            y: -5,
            style: {
              color: '#ef4444',
              fontSize: '10px',
              fontWeight: '600'
            }
          }
        }]
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
        padding: 8,
        useHTML: true,
        formatter: function() {
          const point = this.points?.[0];
          if (!point || point.y === undefined) return '';

          const { date: dateStr, time } = formatTooltipDateTime(point.x as number);
          const value = point.y;
          const isAbove = value >= THRESHOLD;

          return `
            <div style="background: white; padding: 8px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <p style="font-size: 12px; font-weight: 600; color: #111827; margin-bottom: 2px;">${dateStr}</p>
              <p style="font-size: 10px; color: #6b7280; margin-bottom: 4px;">${time}</p>
              <div style="display: flex; align-items: center; gap: 4px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${isAbove ? '#ef4444' : '#22c55e'};"></div>
                <p style="font-size: 12px; font-weight: 500;">
                  <span style="font-weight: 700; color: ${isAbove ? '#dc2626' : '#16a34a'};">
                    ${value.toFixed(1)}${unit}
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
          }
        }
      },

      series: [{
        name: isHumidity ? 'Kelembaban' : 'Suhu',
        type: 'line',
        data: chartData,
        zones: [{
          value: THRESHOLD,
          color: '#22c55e'
        }, {
          color: '#ef4444'
        }]
      }]
    };

    return (
      <div 
        className="w-full bg-white rounded-lg border border-gray-200 p-2"
        style={{
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb'
        }}
      >
        <HighchartsReact
          highcharts={Highcharts}
          options={options}
          ref={chartRef}
          containerProps={{
            style: {
              width: '100%',
              height: '200px'
            }
          }}
        />
      </div>
    );
  }
);

ReportChart.displayName = 'ReportChart';
