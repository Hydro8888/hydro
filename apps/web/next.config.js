/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/freeai',
  assetPrefix: '/freeai',
  transpilePackages: ['@ai-portal/shared', '@ai-portal/db', '@ai-portal/providers'],
  env: {
    NEXT_PUBLIC_BASE_PATH: '/freeai',
  },
};

module.exports = nextConfig;
