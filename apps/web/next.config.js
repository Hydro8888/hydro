/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/ai-portal',
  assetPrefix: '/ai-portal',
  transpilePackages: ['@ai-portal/shared', '@ai-portal/db', '@ai-portal/providers'],
  output: 'standalone',
};

module.exports = nextConfig;
