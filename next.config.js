/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/livenews',
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
