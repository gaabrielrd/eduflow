import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@eduflow/ui"],
  distDir: process.env.NEXT_BUILD_DIST_DIR ?? ".next"
};

export default nextConfig;
