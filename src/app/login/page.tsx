"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLocationsAndDevices } from '@/hooks/useIoTData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, Monitor, MapPin } from 'lucide-react';

const DEVICE_LOCATION_KEY = 'iot_device_location';

export default function LoginPage() {
    const router = useRouter();
    const { login, loginAsLocation, isLoading: authLoading } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [loginType, setLoginType] = useState<'location' | 'admin'>('location');
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [rememberDevice, setRememberDevice] = useState<boolean>(false);
    const [savedLocation, setSavedLocation] = useState<string | null>(null);

    const { data: locationsData } = useLocationsAndDevices();
    const locations = locationsData?.map(l => l.locationName) || [];

    // Baca saved location dari localStorage saat halaman dibuka
    useEffect(() => {
        const saved = localStorage.getItem(DEVICE_LOCATION_KEY);
        if (saved) {
            setSavedLocation(saved);
            setSelectedLocation(saved);
            setRememberDevice(true);
        }
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const result = await login(username, password);
            if (result.success) {
                if (result.user?.assignedLocation) {
                    router.push(`/?location=${encodeURIComponent(result.user.assignedLocation)}`);
                } else {
                    router.push('/');
                }
            } else {
                setError(result.message);
            }
        } catch {
            setError('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLocationLogin = () => {
        if (!selectedLocation) {
            setError('Silakan pilih lokasi terlebih dahulu');
            return;
        }
        setIsSubmitting(true);
        loginAsLocation(selectedLocation, rememberDevice);
        router.push(`/?location=${encodeURIComponent(selectedLocation)}`);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                    <p className="mt-2 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-4">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-30 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full opacity-30 blur-3xl" />
            </div>

            <Card className="w-full max-w-md relative z-10 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 p-3">
                            <img
                                src="/logo parkland white.png"
                                alt="Parkland Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">IoT Humidity Monitor</h1>
                        <p className="text-gray-500 mt-2">Silakan masuk untuk melanjutkan</p>
                    </div>

                    <div className="space-y-5">
                        {/* Error Alert */}
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Tab switcher */}
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                type="button"
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                                    loginType === 'location' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                                onClick={() => { setLoginType('location'); setError(null); }}
                            >
                                Akses Lokasi
                            </button>
                            <button
                                type="button"
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                                    loginType === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                                onClick={() => { setLoginType('admin'); setError(null); }}
                            >
                                Login Admin
                            </button>
                        </div>

                        {loginType === 'location' ? (
                            <div className="space-y-4">
                                {/* Saved device banner */}
                                {savedLocation && (
                                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                                        <Monitor className="h-4 w-4 flex-shrink-0" />
                                        <span>Perangkat ini tersimpan untuk lokasi <strong>{savedLocation}</strong></span>
                                    </div>
                                )}

                                {/* Location dropdown */}
                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-medium flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4 text-blue-500" />
                                        Pilih Lokasi Monitoring
                                    </Label>
                                    <select
                                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedLocation}
                                        onChange={(e) => {
                                            setSelectedLocation(e.target.value);
                                            setError(null);
                                        }}
                                        disabled={isSubmitting || locations.length === 0}
                                    >
                                        <option value="" disabled>-- Pilih Lokasi --</option>
                                        {locations.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Remember device checkbox */}
                                <label className="flex items-center gap-3 cursor-pointer group select-none">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={rememberDevice}
                                            onChange={(e) => setRememberDevice(e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                            rememberDevice
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'border-gray-300 bg-white group-hover:border-blue-400'
                                        }`}>
                                            {rememberDevice && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">Simpan perangkat ini</span>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Lokasi akan diingat, tidak perlu pilih ulang saat login kembali
                                        </p>
                                    </div>
                                </label>

                                <Button
                                    type="button"
                                    onClick={handleLocationLogin}
                                    disabled={isSubmitting || !selectedLocation}
                                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Memproses...
                                        </>
                                    ) : (
                                        'Masuk ke Dashboard'
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-gray-700 font-medium">
                                        Username Admin
                                    </Label>
                                    <Input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Masukkan username"
                                        required
                                        disabled={isSubmitting}
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-gray-700 font-medium">
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Masukkan password"
                                            required
                                            disabled={isSubmitting}
                                            className="h-11 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !username || !password}
                                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Memproses...
                                        </>
                                    ) : (
                                        'Masuk sebagai Admin'
                                    )}
                                </Button>
                            </form>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-400">
                            © 2026 PT. Parkland World Jepara
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
