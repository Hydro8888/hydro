import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: '/ai-portal',
  assetPrefix: '/ai-portal',
  transpilePackages: ['@ai-portal/shared', '@ai-portal/db', '@ai-portal/providers'],
  output: 'standalone',
};

export default nextConfig;
