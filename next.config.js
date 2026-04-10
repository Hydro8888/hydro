/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/simburum',
  output: 'standalone',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
