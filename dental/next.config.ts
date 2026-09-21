import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/dental",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
