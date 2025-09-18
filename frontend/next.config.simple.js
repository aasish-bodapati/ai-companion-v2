/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration for stable development
  reactStrictMode: true,
  
  // Enable source maps in development
  productionBrowserSourceMaps: false,
  
  // Disable problematic optimizations in development
  swcMinify: true,
  
  // Basic webpack configuration
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Simple watch options for better hot reload
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
