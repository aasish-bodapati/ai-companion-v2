/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove standalone output to ensure Vercel compatibility
  // output: 'standalone' was causing framework detection issues
};

module.exports = nextConfig;
