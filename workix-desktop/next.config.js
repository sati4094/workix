/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output for Tauri compatibility with dynamic routes
  output: 'standalone',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
