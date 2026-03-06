import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  allowedDevOrigins: ["http://192.168.29.42:3000", "http://localhost:3000"],
};

export default nextConfig;
