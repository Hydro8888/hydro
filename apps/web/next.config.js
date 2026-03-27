/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/freeai',
  assetPrefix: '/freeai',
  transpilePackages: ['@ai-portal/shared', '@ai-portal/db', '@ai-portal/providers'],
  output: 'standalone',
};

module.exports = nextConfig;
