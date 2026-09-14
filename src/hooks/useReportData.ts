"use client";

import { useState, useCallback } from 'react';
import { api } from '@/lib/axios';
import { SensorDataFromAPI, DeviceFromAPI } from '@/types/api';

export interface ReportFilters {
    date: string; // YYYY-MM-DD format
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
}

export interface ReportStatistics {
    avgHumidity: number;
    minHumidity: number;
    maxHumidity: number;
    avgTemp: number;
    minTemp: number;
    maxTemp: number;
    totalRecords: number;
    alertCount: number;
    maxHumidityTime: string;
    minHumidityTime: string;
    maxHumidityDevice: string;
    minHumidityDevice: string;
}

export interface ReportData extends ReportStatistics {
    data: SensorDataFromAPI[];
}

const HUMIDITY_THRESHOLD = 60; // Alert threshold

export const useReportData = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reportData, setReportData] = useState<ReportData | null>(null);

    const fetchReportData = useCallback(async (
        devices: DeviceFromAPI[],
        filters: ReportFilters
    ): Promise<ReportData | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const deviceIds = devices.map(d => d.id_device);

            // Fetch data for the specific date
            const promises = deviceIds.map(async (deviceId) => {
                const { data } = await api.get(`/data/${deviceId}`, {
                    params: {
                        start_date: filters.date,
                        end_date: filters.date,
                    },
                });
                return (data as SensorDataFromAPI[]).map(item => ({
                    ...item,
                    deviceLocation: devices.find(d => d.id_device.trim() === item.id_device.trim())?.location || ''
                }));
            });

            const results = await Promise.all(promises);
            let allData = results.flat();

            // Filter by time range (startTime - endTime)
            const startHour = parseInt(filters.startTime.split(':')[0]);
            const startMinute = parseInt(filters.startTime.split(':')[1]);
            const endHour = parseInt(filters.endTime.split(':')[0]);
            const endMinute = parseInt(filters.endTime.split(':')[1]);

            allData = allData.filter(item => {
                const itemDate = new Date(item.datetime);
                const itemHour = itemDate.getHours();
                const itemMinute = itemDate.getMinutes();
                const itemTimeMinutes = itemHour * 60 + itemMinute;
                const startTimeMinutes = startHour * 60 + startMinute;
                const endTimeMinutes = endHour * 60 + endMinute;

                return itemTimeMinutes >= startTimeMinutes && itemTimeMinutes <= endTimeMinutes;
            });

            // Sort by datetime (ascending for charts)
            allData.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

            // Calculate statistics
            if (allData.length === 0) {
                const emptyStats: ReportData = {
                    data: [],
                    avgHumidity: 0,
                    minHumidity: 0,
                    maxHumidity: 0,
                    avgTemp: 0,
                    minTemp: 0,
                    maxTemp: 0,
                    totalRecords: 0,
                    alertCount: 0,
                    maxHumidityTime: '-',
                    minHumidityTime: '-',
                    maxHumidityDevice: '-',
                    minHumidityDevice: '-',
                };
                setReportData(emptyStats);
                setIsLoading(false);
                return emptyStats;
            }

            const humidities = allData.map(d => parseFloat(d.hum.toString()));
            const temps = allData.map(d => parseFloat(d.temp.toString()));

            const maxHumIdx = humidities.indexOf(Math.max(...humidities));
            const minHumIdx = humidities.indexOf(Math.min(...humidities));

            const stats: ReportData = {
                data: allData,
                avgHumidity: humidities.reduce((a, b) => a + b, 0) / humidities.length,
                minHumidity: Math.min(...humidities),
                maxHumidity: Math.max(...humidities),
                avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
                minTemp: Math.min(...temps),
                maxTemp: Math.max(...temps),
                totalRecords: allData.length,
                alertCount: humidities.filter(h => h > HUMIDITY_THRESHOLD).length,
                maxHumidityTime: new Date(allData[maxHumIdx].datetime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                minHumidityTime: new Date(allData[minHumIdx].datetime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                maxHumidityDevice: allData[maxHumIdx].id_device,
                minHumidityDevice: allData[minHumIdx].id_device,
            };

            setReportData(stats);
            setIsLoading(false);
            return stats;

        } catch (err) {
            console.error('[Report] Error:', err);
            setIsLoading(false);
            setError(err instanceof Error ? err.message : 'Failed to fetch report data');
            return null;
        }
    }, []);

    const clearReport = useCallback(() => {
        setReportData(null);
        setError(null);
    }, []);

    return {
        reportData,
        fetchReportData,
        clearReport,
        isLoading,
        error,
    };
};
