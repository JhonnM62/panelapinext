/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', '100.42.185.2'],
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://100.42.185.2:8015',
  },

  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
      };
    }

    return config;
  },

  experimental: {
    optimizeCss: true,
  },

  // async redirects() {
  //   return [
  //     {
  //       source: '/dashboard',
  //       destination: '/dashboard/sessions',
  //       permanent: false,
  //     },
  //   ];
  // },

  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: false, // Temporalmente desactivado para solucionar notificaciones duplicadas

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig;
