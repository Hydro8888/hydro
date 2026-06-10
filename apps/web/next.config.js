/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/freeai',
  trailingSlash: false,
  transpilePackages: ['@ai-portal/shared', '@ai-portal/db', '@ai-portal/providers'],
};

module.exports = nextConfig;
