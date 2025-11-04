import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/superadmin',
  
  // API Proxy configuration for development
  // This allows the frontend to proxy API requests to the backend
  // Use NEXT_PUBLIC_API_URL=/api in development to enable this
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.BACKEND_API_URL || 'http://localhost:4000/:path*',
      },
    ];
  },
  
  /* config options here */
};

export default nextConfig;
