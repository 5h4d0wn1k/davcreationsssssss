import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/admin-frontend',
  assetPrefix: '/admin-frontend',
  trailingSlash: true,        // Optimize for standalone production build
};

export default nextConfig;
