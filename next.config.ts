import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vgogceknmqdqzzpztkrr.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/(.*)\\.webmanifest",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/comparador",
        destination: "/comparar",
        statusCode: 301,
      },
      {
        source: "/musica",
        destination: "/musica/naipe_cordas",
        statusCode: 301,
      },
      {
        source: "/anuncie",
        destination: "/programas/anuncie",
        statusCode: 301,
      },
      {
        source: "/anuncie/contrato",
        destination: "/programas/anuncie/contrato",
        statusCode: 301,
      },
      {
        source: "/blog/renda-extra",
        destination: "/programas",
        statusCode: 301,
      },
      {
        source: "/comparador-de-cordas.html",
        destination: "/comparar",
        statusCode: 301,
      },
      {
        source: "/guia-de-cordas.html",
        destination: "/guia-de-cordas",
        statusCode: 301,
      },
      {
        source: "/index.html",
        destination: "/",
        statusCode: 301,
      },
      {
        source: "/en/index.html",
        destination: "/",
        statusCode: 301,
      },
      {
        source: "/es/index.html",
        destination: "/",
        statusCode: 301,
      },
      {
        source: "/sitemap",
        destination: "/sitemap.xml",
        statusCode: 301,
      },
      {
        source: "/sitemap_index.xml",
        destination: "/sitemap.xml",
        statusCode: 301,
      },
      {
        source: "/sitemap-index.xml",
        destination: "/sitemap.xml",
        statusCode: 301,
      },
      {
        source: "/sitemap-0.xml",
        destination: "/sitemap.xml",
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;
