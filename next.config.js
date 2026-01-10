/** @type {import('next').NextConfig} */
const nextConfig = {
  // 使用 Edge Runtime，兼容 Cloudflare Pages
  experimental: {
    runtime: 'edge',
  },
}

module.exports = nextConfig
