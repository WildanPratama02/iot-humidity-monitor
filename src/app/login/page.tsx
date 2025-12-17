"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Droplets, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading: authLoading } = useAuth();
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const result = await login(username, password);
            
            if (result.success) {
                router.push('/');
            } else {
                setError(result.message);
            }
        } catch {
            setError('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
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

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error Alert */}
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Username Field */}
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-gray-700 font-medium">
                                Username
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

                        {/* Password Field */}
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

                        {/* Submit Button */}
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
                                'Masuk'
                            )}
                        </Button>
                    </form>

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
