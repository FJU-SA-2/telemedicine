/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,  // 加這行
  },
  typescript: {
    ignoreBuildErrors: true,   // 加這行
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_URL}/api/:path*` },
      { source: "/uploads/:path*", destination: `${API_URL}/uploads/:path*` },
    ];
  },
};

export default nextConfig;