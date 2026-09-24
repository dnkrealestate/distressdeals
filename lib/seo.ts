import type { Metadata } from 'next'
import { seoAPI } from './api'

export interface SeoDefaults {
  title: string
  description: string
  path: string
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
    : undefined

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: defaults.path },
    openGraph: { title, description, type: 'website', url: defaults.path },
  }
}
