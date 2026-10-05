import type { Metadata } from 'next'
import { seoAPI } from './api'

// The picture shown when any general page is shared (WhatsApp, Facebook, LinkedIn, X…). Pages about one thing
// (a property, project, article, area, building…) use their own photo instead, falling back to this.
// Next.js replaces the site-wide openGraph with a page's own, so every page that sets openGraph must include images.
// The standard wide share format (1200×630, 1.91:1) — fits Facebook, LinkedIn, X and WhatsApp without filler or crops.
// Bump the file name when the design changes: WhatsApp/Facebook cache previews by image URL.
export const DEFAULT_SHARE_IMAGE = {
  url: '/og/distress-deals-share-v3.jpg',
  width: 1200,
  height: 630,
  alt: 'Distress Deals UAE — Sell direct. Buy direct. No third-party agents.',
}
export const shareImages = (url?: string | null, alt?: string) => (url ? [{ url, ...(alt ? { alt } : {}) }] : [DEFAULT_SHARE_IMAGE])

export interface SeoDefaults {
  title: string
  description: string
  path: string
  // Used until keywords are saved for the page in Admin → SEO.
  keywords?: string[]
}

// Fetches this page's admin-editable SEO override (title/description/keywords — see app/admin/(dashboard)/seo)
// and merges it over the page's own hardcoded defaults, so a page never goes blank just because no one has
// edited it yet. Used from each static page's `generateMetadata` in place of a plain `export const metadata`.
export async function resolveSeo(pageKey: string, defaults: SeoDefaults): Promise<Metadata> {
  const override = await seoAPI.get(pageKey)
    .then(r => (r.data.success ? r.data.data : {}) as { title?: string; description?: string; keywords?: string })
    .catch(() => ({}) as { title?: string; description?: string; keywords?: string })

  const title = override.title || defaults.title
  const description = override.description || defaults.description
  const keywords = override.keywords
    ? override.keywords.split(',').map(k => k.trim()).filter(Boolean)
    : defaults.keywords

  return {
    // The root layout's title template appends " | Distress Deals UAE" — skip it when the title already names the
    // brand, so it never shows twice.
    title: /distress\s*deals/i.test(title) ? { absolute: title } : title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: defaults.path },
    openGraph: { title, description, type: 'website', url: defaults.path, images: [DEFAULT_SHARE_IMAGE] },
    twitter: { card: 'summary_large_image', title, description, images: [DEFAULT_SHARE_IMAGE.url] },
  }
}
