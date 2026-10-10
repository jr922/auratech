import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self' * data: blob: 'unsafe-inline' 'unsafe-eval' ws: wss:;
  script-src 'self' 'unsafe-eval' 'unsafe-inline' *;
  style-src 'self' 'unsafe-inline' *;
  img-src 'self' blob: data: *;
  font-src 'self' *;
  connect-src 'self' ws: wss: *;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', 
      },
      {
        protocol: 'https',
        hostname: 'casemotions.pe', 
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', 
      },
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com', 
      },
    ],
  },
  allowedDevOrigins: ['www.sneakers-shops.com', 'sneakers-shops.com', 'https://www.sneakers-shops.com'],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
          { key: 'Content-Security-Policy', value: cspHeader },
        ],
      },
    ];
  },
};

export default nextConfig;
