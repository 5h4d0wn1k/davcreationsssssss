import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/superadmin-frontend',  // Set the base path for routing
  assetPrefix: '/superadmin-frontend',
  trailingSlash: true,
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
