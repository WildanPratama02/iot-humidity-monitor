"use client";

import { useEffect, useRef, useCallback } from 'react';
import { SensorDataFromAPI } from '@/types/api';

interface AlertConfig {
    tempThreshold: number;
    humThreshold: number;
}

interface DeviceAlertState {
    [deviceId: string]: {
        wasInDanger: boolean;
        lastAlertTime: number;
    };
}

const DEFAULT_CONFIG: AlertConfig = {
    tempThreshold: 25, // °C
    humThreshold: 60,  // %
};

// Minimum time between alerts for the same device (in ms)
const ALERT_COOLDOWN = 60000; // 1 minute

/**
 * useAlertSystem Hook
 * Monitors sensor data and triggers browser notifications when thresholds are exceeded.
 * Only notifies once when transitioning from safe → danger to prevent spam.
 */
export function useAlertSystem(
    sensorData: SensorDataFromAPI | null | undefined,
    locationName: string,
    config: AlertConfig = DEFAULT_CONFIG
) {
    const alertStateRef = useRef<DeviceAlertState>({});
    const permissionRef = useRef<NotificationPermission>('default');

    // Request notification permission on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            Notification.requestPermission().then((permission) => {
                permissionRef.current = permission;
            });
        }
    }, []);

    // Show browser notification
    const showNotification = useCallback((title: string, body: string) => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return;
        }

        if (permissionRef.current === 'granted') {
            try {
                new Notification(title, {
                    body,
                    icon: '/favicon.ico',
                    tag: `alert-${locationName}`, // Prevents duplicate notifications
                    requireInteraction: false,
                });
            } catch (error) {
                // Fallback for browsers that don't support Notification constructor
                console.warn('Browser notification failed:', error);
            }
        }
    }, [locationName]);

    // Monitor sensor data for threshold breaches
    useEffect(() => {
        if (!sensorData) return;

        const deviceId = sensorData.id_device;
        const now = Date.now();

        // Check if current reading exceeds thresholds
        const isTempDanger = sensorData.temp > config.tempThreshold;
        const isHumDanger = sensorData.hum > config.humThreshold;
        const isInDanger = isTempDanger || isHumDanger;

        // Get previous state for this device
        const prevState = alertStateRef.current[deviceId] || {
            wasInDanger: false,
            lastAlertTime: 0,
        };

        // Check if we should trigger an alert
        // Only trigger when transitioning from safe to danger
        // And respect cooldown period
        const shouldAlert =
            isInDanger &&
            !prevState.wasInDanger &&
            (now - prevState.lastAlertTime) > ALERT_COOLDOWN;

        if (shouldAlert) {
            // Build alert message
            let alertType = '';
            let alertValue = '';

            if (isTempDanger && isHumDanger) {
                alertType = 'Suhu & Kelembaban Tinggi';
                alertValue = `${sensorData.temp.toFixed(1)}°C / ${sensorData.hum.toFixed(1)}%`;
            } else if (isTempDanger) {
                alertType = 'Suhu Tinggi';
                alertValue = `${sensorData.temp.toFixed(1)}°C`;
            } else {
                alertType = 'Kelembaban Tinggi';
                alertValue = `${sensorData.hum.toFixed(1)}%`;
            }

            showNotification(
                `⚠️ ALERT: ${locationName}`,
                `${alertType} (${alertValue})!`
            );

            // Update state
            alertStateRef.current[deviceId] = {
                wasInDanger: true,
                lastAlertTime: now,
            };
        } else {
            // Update danger state without triggering alert
            alertStateRef.current[deviceId] = {
                ...prevState,
                wasInDanger: isInDanger,
            };
        }
    }, [sensorData, locationName, config, showNotification]);

    // Return permission status for UI feedback
    return {
        permissionStatus: permissionRef.current,
        requestPermission: useCallback(async () => {
            if (typeof window !== 'undefined' && 'Notification' in window) {
                const permission = await Notification.requestPermission();
                permissionRef.current = permission;
                return permission;
            }
            return 'denied' as NotificationPermission;
        }, []),
    };
}

/**
 * Hook to request notification permission on app load
 */
export function useNotificationPermission() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }, []);
}
