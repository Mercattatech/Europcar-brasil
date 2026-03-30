/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: 'standalone' output removed — Vercel handles its own optimized bundling.
  // Using 'standalone' on Vercel can cause module resolution issues with native packages.
  serverExternalPackages: ['@prisma/client'],
};

module.exports = nextConfig;
