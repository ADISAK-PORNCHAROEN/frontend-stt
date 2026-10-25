import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  distDir: process.env.FRONTEND_STT_TEST_BUILD === "1" ? ".next-stt-test" : ".next",
  experimental: {
    agentFeedback: true,
    turbopackFileSystemCacheForBuild: false,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
