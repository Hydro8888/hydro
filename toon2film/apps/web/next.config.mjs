import path from "node:path";
import { fileURLToPath } from "node:url";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/toon2film";
const configDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  trailingSlash: false,
  turbopack: {
    root: path.resolve(configDir, "../.."),
  },
};

export default nextConfig;
