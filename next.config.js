/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/livenews',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
