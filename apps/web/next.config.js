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
  // Proxy API requests to the NestJS backend
  async rewrites() {
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
