import type { NextConfig } from "next";
import os from "os";

function getLocalDevOrigins(): string[] {
  const origins = new Set<string>(["10.219.6.251", "localhost", "127.0.0.1"]);
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        origins.add(net.address);
      }
    }
  }
  return Array.from(origins);
}

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
    loader: 'custom',
    loaderFile: './lib/imageLoader.ts',
    imageSizes: [400],
    deviceSizes: [800, 1200],
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
  allowedDevOrigins: [
    ...getLocalDevOrigins(),
    'www.sneakers-shops.com',
    'sneakers-shops.com',
  ],
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
