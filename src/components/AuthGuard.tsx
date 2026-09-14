"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

/**
 * AuthGuard Component
 * Client-side route protection based on localStorage JWT token
 * Redirects unauthenticated users to login page
 */
export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
    const { isAuthenticated, isLoading, isAdmin, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading) {
            // If not authenticated, redirect to login
            if (!isAuthenticated) {
                router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
                return;
            }

            // If admin required but user is not admin
            if (requireAdmin && !isAdmin) {
                // Redirect to home with access denied message
                router.replace('/?error=access_denied');
            }
        }
    }, [isAuthenticated, isLoading, isAdmin, requireAdmin, router, pathname]);

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                    <p className="mt-2 text-gray-600">Memeriksa autentikasi...</p>
                </div>
            </div>
        );
    }

    // Not authenticated, show nothing (redirect will happen)
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                    <p className="mt-2 text-gray-600">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    // Admin required but not admin
    if (requireAdmin && !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🚫</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
                    <p className="text-gray-600 mb-4">
                        Halaman ini hanya dapat diakses oleh Admin.
                    </p>
                    <p className="text-sm text-gray-500">
                        Login sebagai: <strong>{user?.username}</strong> ({user?.role})
                    </p>
                </div>
            </div>
        );
    }

    // Authenticated and authorized, render children
    return <>{children}</>;
}
