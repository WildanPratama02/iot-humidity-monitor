"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/AuthGuard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Cpu, 
    Plus, 
    Trash2, 
    Edit,
    ArrowLeft, 
    Loader2,
    X,
    MapPin,
    Wifi
} from 'lucide-react';

interface Device {
    id_device: string;
    location: string;
    detil_location: string;
    mac_address: string;
}

function DeviceManagementContent() {
    const router = useRouter();
    const { token } = useAuth();
    
    const [devices, setDevices] = useState<Device[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentDevice, setCurrentDevice] = useState({
        id_device: '',
        location: '',
        detil_location: '',
        mac_address: ''
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

    const fetchDevices = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/admin/devices`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch devices');
            }

            const data = await response.json();
            setDevices(data.data || []);
        } catch (err) {
            console.error('Fetch devices error:', err);
            setError('Gagal mengambil data device');
        }
    }, [token, API_URL]);

    useEffect(() => {
        if (token) {
            fetchDevices().then(() => setIsLoading(false));
        }
    }, [token, fetchDevices]);

    const handleOpenAdd = () => {
        setIsEditing(false);
        setCurrentDevice({
            id_device: '',
            location: '',
            detil_location: '',
            mac_address: ''
        });
        setSubmitError(null);
        setShowModal(true);
    };

    const handleOpenEdit = (device: Device) => {
        setIsEditing(true);
        setCurrentDevice({
            id_device: device.id_device,
            location: device.location,
            detil_location: device.detil_location || '',
            mac_address: device.mac_address || ''
        });
        setSubmitError(null);
        setShowModal(true);
    };

    const handleSubmit = async () => {
        setSubmitError(null);
        setIsSubmitting(true);

        try {
            const url = isEditing 
                ? `${API_URL}/admin/devices/${currentDevice.id_device}`
                : `${API_URL}/admin/devices`;
            
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(currentDevice)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to save device');
            }

            // Refresh list
            await fetchDevices();
            setShowModal(false);

        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id_device: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus device "${id_device}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/admin/devices/${id_device}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete device');
            }

            await fetchDevices();

        } catch (err) {
            alert(err instanceof Error ? err.message : 'Gagal menghapus device');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                    <p className="mt-2 text-gray-600">Memuat data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push('/')}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Manajemen Device</h1>
                                <p className="text-sm text-gray-500">Kelola sensor dan lokasi device</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleOpenAdd}
                            className="gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Device
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                        {error}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Cpu className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Device</p>
                                <p className="text-2xl font-bold">{devices.length}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Lokasi</p>
                                <p className="text-2xl font-bold">
                                    {[...new Set(devices.map(d => d.location))].length}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Devices Table */}
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID Device
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Lokasi
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Detail Lokasi
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        MAC Address
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {devices.map((device) => (
                                    <tr key={device.id_device} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <Cpu className="h-4 w-4 text-gray-600" />
                                                </div>
                                                <span className="font-medium text-gray-900">{device.id_device}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">{device.location}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {device.detil_location || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Wifi className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm font-mono text-gray-600">{device.mac_address || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenEdit(device)}
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(device.id_device)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {devices.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            Belum ada data device
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </main>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md bg-white">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold">
                                    {isEditing ? 'Edit Device' : 'Tambah Device Baru'}
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowModal(false)}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {submitError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                    {submitError}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="id_device">ID Device</Label>
                                    <Input
                                        id="id_device"
                                        value={currentDevice.id_device}
                                        onChange={(e) => setCurrentDevice({ ...currentDevice, id_device: e.target.value })}
                                        placeholder="Contoh: ESP-001"
                                        disabled={isEditing} // ID device is primary key, usually not editable
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="location">Lokasi Utama</Label>
                                    <Input
                                        id="location"
                                        value={currentDevice.location}
                                        onChange={(e) => setCurrentDevice({ ...currentDevice, location: e.target.value })}
                                        placeholder="Contoh: Gudang 1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="detil_location">Detail Lokasi (Opsional)</Label>
                                    <Input
                                        id="detil_location"
                                        value={currentDevice.detil_location}
                                        onChange={(e) => setCurrentDevice({ ...currentDevice, detil_location: e.target.value })}
                                        placeholder="Contoh: Rak B4, Pojok Kanan"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="mac_address">MAC Address (Opsional)</Label>
                                    <Input
                                        id="mac_address"
                                        value={currentDevice.mac_address}
                                        onChange={(e) => setCurrentDevice({ ...currentDevice, mac_address: e.target.value })}
                                        placeholder="AA:BB:CC:DD:EE:FF"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1"
                                >
                                    Batal
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !currentDevice.id_device || !currentDevice.location}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        'Simpan'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default function DeviceManagementPage() {
    return (
        <AuthGuard requireAdmin>
            <DeviceManagementContent />
        </AuthGuard>
    );
}
