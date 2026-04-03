/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ai-portal/shared', '@ai-portal/db', '@ai-portal/providers'],
};

module.exports = nextConfig;
