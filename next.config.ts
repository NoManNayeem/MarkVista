import type { NextConfig } from "next";

// Use basePath for GitHub Pages - only in production builds
const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/MarkVista' : '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: basePath,
  assetPrefix: basePath,
  trailingSlash: true, // Important for GitHub Pages
  output: 'export', // Static export for GitHub Pages
  images: {
    unoptimized: true, // Required for static export
  },
  // Ensure CSS is properly handled in static export
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Force CSS to be inlined or properly referenced
  compiler: {
    removeConsole: false,
  },
  // Turbopack config (Next.js 16+)
  turbopack: {},
  // Webpack config (for compatibility)
  webpack: (config, { isServer }) => {
    // Fix for canvas in browser (needed for html2canvas)
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }
    return config;
  },
};

export default nextConfig;
