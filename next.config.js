/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/simburum',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
};

module.exports = nextConfig;
