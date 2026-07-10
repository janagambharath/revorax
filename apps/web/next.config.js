/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@revorax/shared', '@revorax/auth'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
  typedRoutes: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:3001/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
