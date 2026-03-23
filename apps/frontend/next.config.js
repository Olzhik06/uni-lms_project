/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';
    return [
      { source: '/api/:path*', destination: `${backendBase}/api/:path*` },
      { source: '/uploads/:path*', destination: `${backendBase}/uploads/:path*` },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};
module.exports = nextConfig;
