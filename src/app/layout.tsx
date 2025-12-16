import type { Metadata } from "next";
import "./globals.css";
import { CustomQueryClientProvider } from "@/components/providers/query-client-provider";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "IoT Humidity Monitoring Dashboard",
  description: "Dashboard monitoring suhu dan kelembaban untuk perangkat IoT",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'IoT Monitor',
  },
  formatDetection: {
    telephone: false,
  },
};
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: 'no',
  themeColor: '#3b82f6',
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">
        <CustomQueryClientProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </CustomQueryClientProvider>
      </body>
    </html>
  );
}
