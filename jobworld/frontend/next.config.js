/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  basePath: '/jobworld',
  images: {
    domains: ['jobworld.co.kr'],
  },
}

module.exports = nextConfig
