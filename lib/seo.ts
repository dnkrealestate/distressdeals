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

// Google shows about 60 characters of a title. The root layout adds " | Distress Deals UAE" (21) to every title, which
// pushes many past that — so: keep the full brand when it fits, a shorter one when that fits, otherwise just the title,
// shortened at a word boundary. Use for every page title: `title: fitTitle(title)`.
const BRAND = ' | Distress Deals UAE', SHORT_BRAND = ' | Distress Deals', MAX_TITLE = 60
const cutAt = (s: string, max: number) => {
  if (s.length <= max) return s
  const cut = s.slice(0, max + 1)
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), Math.floor(max * 0.6))).replace(/[\s|:—–\-,·(&]+$/, '')
}
export function fitTitle(raw: string): Metadata['title'] {
  const t = raw.replace(/\s+/g, ' ').trim()
  if (/distress\s*deals/i.test(t)) return { absolute: cutAt(t, MAX_TITLE) }
  if (t.length + BRAND.length <= MAX_TITLE) return t                       // the layout's template adds the full brand
  if (t.length + SHORT_BRAND.length <= MAX_TITLE) return { absolute: t + SHORT_BRAND }
  return { absolute: cutAt(t, MAX_TITLE) }
}
// Search results show about 155–160 characters of a description — longer ones are cut by Google mid-sentence. Trim at a
// sentence or word boundary instead.
export function fitDescription(raw: string, max = 158): string {
  const d = raw.replace(/\s+/g, ' ').trim()
  if (d.length <= max) return d
  const cut = d.slice(0, max)
  const sentence = cut.lastIndexOf('. ')
  if (sentence > max * 0.6) return cut.slice(0, sentence + 1)
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:—–\-]+$/, '') + '…'
}

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
  const description = fitDescription(override.description || defaults.description)
  const keywords = override.keywords
    ? override.keywords.split(',').map(k => k.trim()).filter(Boolean)
    : defaults.keywords

  return {
    title: fitTitle(title),
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: defaults.path },
    openGraph: { title, description, type: 'website', url: defaults.path, images: [DEFAULT_SHARE_IMAGE] },
    twitter: { card: 'summary_large_image', title, description, images: [DEFAULT_SHARE_IMAGE.url] },
  }
}
