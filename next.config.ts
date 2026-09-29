import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const root = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
    proxyClientMaxBodySize: "12mb",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
