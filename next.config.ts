import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimizaciones para producción
  compress: true,
  poweredByHeader: false,
  
  // Configuración de imágenes
  images: {
    domains: ['localhost'],
  },
  
  // Configuración de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
