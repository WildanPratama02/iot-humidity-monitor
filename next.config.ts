import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.43.175",
    "localhost",
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8091/:path*', // Proxy to Backend
      },
      {
        source: '/notifications/:path*',
        destination: 'http://localhost:8091/notifications/:path*',
      },
      {
        source: '/auth/:path*',
        destination: 'http://localhost:8091/auth/:path*',
      },
      {
        source: '/data/:path*',
        destination: 'http://localhost:8091/data/:path*',
      },
      {
        source: '/devices',
        destination: 'http://localhost:8091/devices',
      },
      {
        source: '/users/:path*',
        destination: 'http://localhost:8091/users/:path*',
      },
      {
        source: '/locations',
        destination: 'http://localhost:8091/locations',
      },
      {
        source: '/health',
        destination: 'http://localhost:8091/health',
      },
    ];
  },
};

export default nextConfig;
