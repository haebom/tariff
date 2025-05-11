import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/tariff',
  assetPrefix: '/tariff',
  images: {
    unoptimized: true,
  },
  /* config options here */
};

export default nextConfig;
