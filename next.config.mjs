/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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