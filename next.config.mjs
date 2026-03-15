/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${process.env.BACKEND_URL}/api/:path*` },
      { source: "/uploads/:path*", destination: `${process.env.BACKEND_URL}/uploads/:path*` },
    ];
  },
};

export default nextConfig;