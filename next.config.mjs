/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Ignore fs module for browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      canvas: false,
    };
    
    return config;
  },
};

export default nextConfig;
