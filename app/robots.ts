import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.distressdealsuae.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Authenticated dashboards and auth flows have nothing to offer a
        // crawler and would otherwise burn crawl budget on private pages.
        // Route groups like (dashboard)/(account) aren't part of the real
        // URL, so the actual dashboard paths are listed explicitly here —
        // `/seller/login` and `/seller/register` are public and stay crawlable.
        disallow: [
          '/admin', '/auth', '/api',
          '/seller/listings', '/seller/leads', '/seller/messages',
          '/buyer/profile', '/buyer/favorites', '/buyer/leads', '/buyer/tours', '/buyer/searches',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
