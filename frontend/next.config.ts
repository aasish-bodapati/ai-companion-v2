import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove standalone output to ensure Vercel compatibility
  // output: 'standalone' was causing framework detection issues
};

export default nextConfig;
