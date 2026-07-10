/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@revorax/shared', '@revorax/auth'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
  experimental: {
    typedRoutes: false,
  },
};

module.exports = nextConfig;
