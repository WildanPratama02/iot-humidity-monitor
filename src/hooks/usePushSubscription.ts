"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface PushSubscriptionState {
    isSubscribed: boolean;
    isSupported: boolean;
    isLoading: boolean;
    error: string | null;
}

/**
 * Convert URL-safe base64 to Uint8Array for VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const outputArray = new Uint8Array(buffer);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * usePushSubscription Hook
 * Manages push notification subscription lifecycle.
 * Automatically subscribes when user is authenticated.
 */
export function usePushSubscription() {
    const { token, isAuthenticated } = useAuth();
    const [state, setState] = useState<PushSubscriptionState>({
        isSubscribed: false,
        isSupported: false,
        isLoading: false,
        error: null,
    });
    const hasSubscribed = useRef(false);

    // Check if push notifications are supported
    useEffect(() => {
        const isSupported =
            typeof window !== 'undefined' &&
            'serviceWorker' in navigator &&
            'PushManager' in window &&
            'Notification' in window;

        setState(prev => ({ ...prev, isSupported }));
    }, []);

    // Register service worker
    const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });
            console.log('[Push] Service worker registered:', registration.scope);
            return registration;
        } catch (error) {
            console.error('[Push] Service worker registration failed:', error);
            return null;
        }
    }, []);

    // Get VAPID public key from backend
    const getVapidPublicKey = useCallback(async (): Promise<string | null> => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';
            const response = await fetch(`${API_URL}/notifications/vapid-public-key`);
            const data = await response.json();

            if (data.success && data.publicKey) {
                return data.publicKey;
            }
            return null;
        } catch (error) {
            console.error('[Push] Failed to get VAPID key:', error);
            return null;
        }
    }, []);

    // Send subscription to backend
    const sendSubscriptionToBackend = useCallback(async (
        subscription: PushSubscription,
        authToken: string
    ): Promise<boolean> => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';
            const response = await fetch(`${API_URL}/notifications/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify(subscription.toJSON()),
            });

            const data = await response.json();
            return data.success === true;
        } catch (error) {
            console.error('[Push] Failed to send subscription to backend:', error);
            return false;
        }
    }, []);

    // Subscribe to push notifications
    const subscribe = useCallback(async () => {
        if (!state.isSupported || !token) {
            console.log('[Push] Not supported or no token');
            return false;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Request notification permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: 'Notification permission denied'
                }));
                return false;
            }

            // Register service worker
            const registration = await registerServiceWorker();
            if (!registration) {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: 'Failed to register service worker'
                }));
                return false;
            }

            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;

            // Get VAPID public key
            const vapidPublicKey = await getVapidPublicKey();
            if (!vapidPublicKey) {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: 'Failed to get VAPID public key'
                }));
                return false;
            }

            // Check for existing subscription
            let subscription = await registration.pushManager.getSubscription();

            // Create new subscription if none exists
            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
                });
                console.log('[Push] New subscription created');
            } else {
                console.log('[Push] Using existing subscription');
            }

            // Send subscription to backend
            const success = await sendSubscriptionToBackend(subscription, token);

            if (success) {
                console.log('[Push] Subscription saved to backend');
                setState(prev => ({
                    ...prev,
                    isSubscribed: true,
                    isLoading: false,
                    error: null,
                }));
                return true;
            } else {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: 'Failed to save subscription to backend'
                }));
                return false;
            }

        } catch (error) {
            console.error('[Push] Subscription error:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }));
            return false;
        }
    }, [state.isSupported, token, registerServiceWorker, getVapidPublicKey, sendSubscriptionToBackend]);

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                console.log('[Push] Unsubscribed');
            }

            setState(prev => ({ ...prev, isSubscribed: false }));
            hasSubscribed.current = false;
        } catch (error) {
            console.error('[Push] Unsubscribe error:', error);
        }
    }, []);

    // Auto-subscribe when authenticated
    useEffect(() => {
        if (isAuthenticated && token && state.isSupported && !hasSubscribed.current) {
            hasSubscribed.current = true;
            subscribe();
        }
    }, [isAuthenticated, token, state.isSupported, subscribe]);

    return {
        ...state,
        subscribe,
        unsubscribe,
    };
}

/**
 * Hook to use in components that need to trigger subscription manually
 */
export function usePushNotificationStatus() {
    const { isSubscribed, isSupported, isLoading, error, subscribe } = usePushSubscription();

    return {
        isSubscribed,
        isSupported,
        isLoading,
        error,
        enableNotifications: subscribe,
    };
}
