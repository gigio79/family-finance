import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.plugins = config.plugins || [];
    return config;
  },
};

export default nextConfig;
