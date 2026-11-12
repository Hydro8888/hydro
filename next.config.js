/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/livenews',
  // next/image is not used (article images go through /api/img). No remote
  // patterns: '**' let /_next/image fetch ANY host, internal addresses included.
  images: { remotePatterns: [] },
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
