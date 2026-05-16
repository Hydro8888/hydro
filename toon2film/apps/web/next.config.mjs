const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/toon2film";

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  trailingSlash: false,
};

export default nextConfig;
