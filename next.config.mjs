/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "Permissions-Policy", value: "interest-cohort=()" }
      ]
    }
  ]
}

export default nextConfig

