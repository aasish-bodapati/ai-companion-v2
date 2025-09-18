/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for development hot reloading
  experimental: {
    // Enable faster refresh
    optimizePackageImports: ['@heroicons/react', '@radix-ui/react-tabs', '@radix-ui/react-select'],
  },

  // Improve development experience
  typescript: {
    // Don't fail build on type errors during development
    ignoreBuildErrors: false,
  },

  // Enable better error overlay
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },

  // Hot reload optimizations
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Enable hot reload for all files
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
      
      // Ensure proper file watching
      config.snapshot = {
        managedPaths: [/^(.+?[\\/]node_modules[\\/])(.+)$/],
      };

      // Fix vendor chunk resolution issues
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };

      // Disable problematic optimizations in development
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
      };
    }
    return config;
  },

  // Development optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Enable source maps for better debugging
    productionBrowserSourceMaps: false,
  }),
};

module.exports = nextConfig;
