"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// Types
export interface User {
    id: number;
    username: string;
    role: 'admin' | 'pic' | 'guest';
    assignedLocation: string | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
    loginAsGuest: () => void;
    loginAsLocation: (location: string, rememberDevice?: boolean) => void;
    logout: () => void;
    clearDeviceLocation: () => void;
    isAdmin: boolean;
    isPIC: boolean;
    isGuest: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'iot_auth_token';
const USER_KEY = 'iot_auth_user';

// Key untuk menyimpan lokasi device secara permanen
const DEVICE_LOCATION_KEY = 'iot_device_location';

/**
 * Decode JWT token payload (without verification - verification happens on backend)
 */
function decodeToken(token: string): { userId: number; username: string; role: 'admin' | 'pic'; assignedLocation: string | null; exp: number } | null {
    try {
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(atob(base64Payload));
        return payload;
    } catch {
        return null;
    }
}

// Non-JWT session tokens yang tidak pernah expire
const NON_JWT_TOKENS = ['location-session', 'guest-session'];

/**
 * Check if token is expired
 * Non-JWT tokens (location-session, guest-session) tidak pernah expire
 */
function isTokenExpired(token: string): boolean {
    // Token non-JWT (location/guest) dianggap selalu valid
    if (NON_JWT_TOKENS.includes(token)) return false;
    const decoded = decodeToken(token);
    if (!decoded) return true;
    // exp is in seconds, Date.now() is in milliseconds
    return decoded.exp * 1000 < Date.now();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
            // Check if token is expired
            if (isTokenExpired(storedToken)) {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
            } else {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        }

        setIsLoading(false);
    }, []);

    const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; message: string; user?: User }> => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
            
            // Encode password with Base64 to hide plain text in network requests
            const encodedPassword = btoa(password);
            
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password: encodedPassword }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                return {
                    success: false,
                    message: data.message || 'Login gagal'
                };
            }

            // Store token and user
            localStorage.setItem(TOKEN_KEY, data.token);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));

            setToken(data.token);
            setUser(data.user);

            return {
                success: true,
                message: 'Login berhasil',
                user: data.user
            };

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Tidak dapat terhubung ke server'
            };
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        // TIDAK menghapus DEVICE_LOCATION_KEY agar device mengingat lokasinya
        setToken(null);
        setUser(null);
    }, []);

    // Fungsi untuk reset pilihan device (ganti lokasi)
    const clearDeviceLocation = useCallback(() => {
        localStorage.removeItem(DEVICE_LOCATION_KEY);
    }, []);

    const loginAsGuest = useCallback(() => {
        // Create a guest user without API call
        const guestUser: User = {
            id: 0,
            username: 'Tamu',
            role: 'guest',
            assignedLocation: null, // Guest can access all locations
        };

        // Use a placeholder token for guest (not a real JWT)
        const guestToken = 'guest-session';

        localStorage.setItem(TOKEN_KEY, guestToken);
        localStorage.setItem(USER_KEY, JSON.stringify(guestUser));

        setToken(guestToken);
        setUser(guestUser);
    }, []);

    const loginAsLocation = useCallback((location: string, rememberDevice: boolean = true) => {
        const picUser: User = {
            id: 0,
            username: `PIC ${location}`,
            role: 'pic',
            assignedLocation: location,
        };

        const picToken = 'location-session';

        if (rememberDevice) {
            // Simpan lokasi secara permanen agar device tidak perlu pilih ulang
            localStorage.setItem(DEVICE_LOCATION_KEY, location);
        } else {
            localStorage.removeItem(DEVICE_LOCATION_KEY);
        }
        localStorage.setItem(TOKEN_KEY, picToken);
        localStorage.setItem(USER_KEY, JSON.stringify(picUser));

        setToken(picToken);
        setUser(picUser);
    }, []);

    const value = useMemo(() => ({
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        loginAsGuest,
        loginAsLocation,
        logout,
        clearDeviceLocation,
        isAdmin: user?.role === 'admin',
        isPIC: user?.role === 'pic',
        isGuest: user?.role === 'guest',
    }), [user, token, isLoading, login, loginAsGuest, loginAsLocation, logout, clearDeviceLocation]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

/**
 * Hook to get auth token for API requests
 */
export function useAuthToken(): string | null {
    const { token } = useAuth();
    return token;
}

/**
 * Hook to check if user has access to a specific location
 */
export function useLocationAccess(locationName: string): boolean {
    const { user, isAdmin } = useAuth();
    
    // Admin has access to all locations
    if (isAdmin) return true;
    
    // PIC only has access to assigned location
    if (user?.role === 'pic') {
        return user.assignedLocation === locationName;
    }
    
    return false;
}
