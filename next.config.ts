import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === 'production';
const backendUrl = isProduction
  ? 'http://localhost:8091'  // Production: backend on same server via NGINX
  : 'http://192.168.43.175:8091'; // Development: local backend

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "iot-humidity.qdms.web.id",
    "192.168.40.193",
    "192.168.43.175",
    "localhost",
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`, // Proxy to Backend
      },
      {
        source: '/notifications/:path*',
        destination: `${backendUrl}/notifications/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${backendUrl}/auth/:path*`,
      },
      {
        source: '/data/:path*',
        destination: `${backendUrl}/data/:path*`,
      },
      {
        source: '/devices',
        destination: `${backendUrl}/devices`,
      },
      {
        source: '/users/:path*',
        destination: `${backendUrl}/users/:path*`,
      },
      {
        source: '/locations',
        destination: `${backendUrl}/locations`,
      },
      {
        source: '/health',
        destination: `${backendUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
