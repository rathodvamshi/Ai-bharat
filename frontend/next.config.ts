import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  // Remove standalone for Amplify compatibility
  allowedDevOrigins: ["http://192.168.29.42:3000", "http://localhost:3000"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
