"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Users, LogOut, Shield, MapPin, ChevronRight, UserCircle, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * User Menu Component
 * Displays user info and admin menu in sidebar
 */
interface UserMenuProps {
    className?: string;
}

export function UserMenu({ className = '' }: UserMenuProps) {
    const { user, logout, isAdmin, isGuest } = useAuth();

    if (!user) return null;

    return (
        <div className={`border-t border-gray-200 bg-gray-50 ${className}`}>
            {/* User Info */}
            <div className="p-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isAdmin ? 'bg-purple-100' : isGuest ? 'bg-gray-100' : 'bg-blue-100'
                    }`}>
                        {isAdmin ? (
                            <Shield className="h-4 w-4 text-purple-600" />
                        ) : isGuest ? (
                            <UserCircle className="h-4 w-4 text-gray-600" />
                        ) : (
                            <MapPin className="h-4 w-4 text-blue-600" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {user.username}
                        </p>
                        <p className="text-xs text-gray-500">
                            {isAdmin ? 'Administrator' : isGuest ? 'Mode Tamu' : `PIC: ${user.assignedLocation}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Admin Menu */}
            {isAdmin && (
                <Link
                    href="/admin/users"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                    <Users className="h-4 w-4" />
                    <span>Manajemen User</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                </Link>
            )}
            
            {isAdmin && (
                <Link
                    href="/admin/devices"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                    <Cpu className="h-4 w-4" />
                    <span>Manajemen Device</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                </Link>
            )}

            {/* Logout Button - with extra padding for mobile nav bar */}
            <div className="p-3 pb-20 lg:pb-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );
}

export function useFilteredLocations<T extends { locationName: string }>(
    locations: T[]
): T[] {
    // Return all locations without exception / hiding any devices
    return locations;
}

/**
 * Get welcome message based on user role
 */
export function useWelcomeMessage(): string {
    const { user, isAdmin, isGuest } = useAuth();

    return useMemo(() => {
        if (!user) return '';
        
        if (isAdmin) {
            return 'Anda login sebagai Administrator. Anda dapat melihat semua lokasi.';
        }

        if (isGuest) {
            return 'Anda login sebagai Tamu. Anda dapat melihat semua lokasi tanpa notifikasi.';
        }

        return `Anda login sebagai PIC untuk lokasi: ${user.assignedLocation}`;
    }, [user, isAdmin, isGuest]);
}
