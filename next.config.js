/** @type {import('next').NextConfig} */
const nextConfig = {
  // 注意：开发环境使用 Node.js Runtime
  // 部署到 Cloudflare Pages 时需要配置 Edge Runtime 和 Driver Adapters
  
  output: 'standalone',
  
  // Enable React Strict Mode for better error detection
  reactStrictMode: true,
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  
  // Webpack configuration for better HMR handling
  webpack: (config, { dev, isServer }) => {
    // Only apply these configurations in development mode
    if (dev && !isServer) {
      // Prevent aggressive module removal during HMR to reduce race conditions
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
    }
    
    return config
  },
  
  // Build optimization settings
  swcMinify: true,
  
  // Static asset handling
  images: {
    domains: [],
    unoptimized: false,
  },
  
  // Better error reporting in development
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig
