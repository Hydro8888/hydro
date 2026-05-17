import path from "node:path";
import { fileURLToPath } from "node:url";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/toon2film";
const configDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  trailingSlash: false,
  turbopack: {
    root: path.resolve(configDir, "../.."),
  },
};

export default nextConfig;
