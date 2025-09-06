/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    // Strip console.* in production bundles except error/warn
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  eslint: {
    // CI runs lint explicitly; don't block production builds on lint
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    },
    // Tree-shake large libs on the client for smaller bundles
    optimizePackageImports: ['lucide-react', 'zod']
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "Permissions-Policy", value: "interest-cohort=()" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
          ].join('; ')
        },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
      ]
    }
    ,
    {
      // Modest caching for brand assets that don't change often
      source: "/(brand|icons)/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=86400" }
      ]
    }
  ]
}

export default nextConfig
