import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/Species-Advancement-Tech-Forum" : "",
  assetPrefix: isProd ? "/Species-Advancement-Tech-Forum/" : "",
  images: {
    unoptimized: true, // ← Add this
  },
};

export default nextConfig;
