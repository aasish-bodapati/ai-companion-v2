import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Remove rewrites to let the frontend use NEXT_PUBLIC_API_URL directly
};

export default nextConfig;
