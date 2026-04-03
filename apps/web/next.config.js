/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/freeai',
  transpilePackages: ['@ai-portal/shared', '@ai-portal/db', '@ai-portal/providers'],
};

module.exports = nextConfig;
