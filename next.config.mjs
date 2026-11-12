/** @type {import('next').NextConfig} */
const nextConfig = {
  // A second build folder for local performance testing (NEXT_DIST_DIR=.next-perf) — never set in production.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    // AVIF first (roughly a third smaller than WebP), WebP for browsers without it. Optimised copies are cached.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'ds0s9stbs0aat.cloudfront.net' },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'distressdealsuae.com', 'www.distressdealsuae.com'],
    },
  },
  // One address for the whole site: the bare domain sends visitors and Google to www (301), so links and crawl
  // credit are never split between two hosts. /.well-known/ is the exception: Android App Links verification
  // (public/.well-known/assetlinks.json) must be answered on each host directly — Google rejects a redirect there.
  async redirects() {
    return [
      { source: '/:path((?!\\.well-known/).*)', has: [{ type: 'host', value: 'distressdealsuae.com' }], destination: 'https://www.distressdealsuae.com/:path', permanent: true },
      // Old addresses Google still requests (Search Console "Not found (404)") that have a genuine replacement — only
      // the same place under its current address, never an unrelated page.
      { source: '/areas/dubai-hills', destination: '/areas/dubai-hills-estate', permanent: true },
      // The single "Damac Islands" project record was replaced by one record per cluster (Bora Bora, Maldives, Fiji…);
      // the community page lists them all.
      { source: '/projects/damac-islands-mufjrzbc/:rest(units)?', destination: '/communities/damac-islands', permanent: true },
    ]
  },
  // Build files (CSS / JS) are fetched by Google to draw pages but are not pages: say so, so they stop showing up in
  // Search Console's "Crawled – currently not indexed" list. Rendering is unaffected — noindex only governs the index.
  async headers() {
    return [
      { source: '/_next/static/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] },
    ]
  },
  async rewrites() {
    // Uploaded property images are stored/served by the Express API as
    // relative `/uploads/...` paths. Proxy them through Next so both plain
    // <img> tags and next/image resolve them without a hardcoded backend host.
    const fallback = process.env.NODE_ENV === 'production' ? 'https://data.distressdealsuae.com/api/v1' : 'http://localhost:5000/api/v1'
    const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || fallback).replace(/\/api\/v1\/?$/, '')
    return [
      { source: '/uploads/:path*', destination: `${apiOrigin}/uploads/:path*` },
    ]
  },
}

export default nextConfig