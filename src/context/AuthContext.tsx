"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// Types
export interface User {
    id: number;
    username: string;
    role: 'admin' | 'pic';
    assignedLocation: string | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
    logout: () => void;
    isAdmin: boolean;
    isPIC: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'iot_auth_token';
const USER_KEY = 'iot_auth_user';

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

/**
 * Check if token is expired
 */
function isTokenExpired(token: string): boolean {
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
                // Clear expired token
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
            } else {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        }

        setIsLoading(false);
    }, []);

    const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';
            
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
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
                message: 'Login berhasil'
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
        setToken(null);
        setUser(null);
    }, []);

    const value = useMemo(() => ({
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        isAdmin: user?.role === 'admin',
        isPIC: user?.role === 'pic',
    }), [user, token, isLoading, login, logout]);

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
