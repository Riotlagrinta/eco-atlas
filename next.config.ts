import type { NextConfig } from "next";

import "@ducanh2912/next-pwa";
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  }
};

export default withPWA(nextConfig);
