/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    const securityHeaders = [
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value:
          "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self';",
          "script-src 'self' 'unsafe-inline' https://js.stripe.com;",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
          "img-src 'self' data: blob: https://*.stripe.com https://i.imgur.com https://images.unsplash.com https://plus.unsplash.com https://*.supabase.co;",
          "font-src 'self' https://fonts.gstatic.com;",
          "connect-src 'self' https://*.supabase.co https://api.stripe.com;",
          "frame-src https://js.stripe.com https://hooks.stripe.com;",
          "object-src 'none';",
          "base-uri 'self';",
          "form-action 'self' https://hooks.stripe.com;",
        ].join(" "),
      },
    ]

    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
