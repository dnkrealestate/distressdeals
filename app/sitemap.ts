import type { MetadataRoute } from 'next'
import { propertyAPI, blogAPI, newsAPI, projectAPI } from '@/lib/api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://distressdeals.ae'

// Static, always-present routes — everything else below is generated from
// live data so new listings/posts/projects show up without a manual edit.
const STATIC_ROUTES = [
  '', '/buyer/properties', '/projects', '/blog', '/news',
  '/about', '/areas', '/mortgage', '/developers', '/auth/login', '/auth/register',
  '/seller/register',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map(path => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.6,
  }))

  // Each fetch is isolated — one failing source (e.g. the API being briefly
  // down) shouldn't take the whole sitemap down with it.
  const [properties, posts, articles, projects] = await Promise.all([
    propertyAPI.getAll({ limit: 1000 }).then(r => r.data.data?.data || []).catch(() => []),
    blogAPI.getAll({ limit: 500 }).then(r => r.data.data?.data || r.data.data || []).catch(() => []),
    newsAPI.getAll({ limit: 500 }).then(r => r.data.data?.data || r.data.data || []).catch(() => []),
    projectAPI.getAll({ limit: 500 }).then(r => r.data.data?.data || r.data.data || []).catch(() => []),
  ])

  const areas = await propertyAPI.getAreaStats(200).then(r => r.data.data || []).catch(() => [])
  const developers = await projectAPI.getAllDevelopers().then(r => r.data.data || []).catch(() => [])

  for (const p of properties) {
    entries.push({
      url: `${SITE_URL}/buyer/properties/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }
  for (const post of posts) {
    entries.push({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt),
      changeFrequency: 'monthly',
      priority: 0.5,
    })
  }
  for (const a of articles) {
    entries.push({
      url: `${SITE_URL}/news/${a.slug}`,
      lastModified: a.publishedAt ? new Date(a.publishedAt) : new Date(a.createdAt),
      changeFrequency: 'monthly',
      priority: 0.5,
    })
  }
  for (const proj of projects) {
    entries.push({
      url: `${SITE_URL}/projects/${proj.slug}`,
      lastModified: new Date(proj.createdAt),
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }
  for (const a of areas as { area: string }[]) {
    if (!a.area) continue
    entries.push({
      url: `${SITE_URL}/areas/${encodeURIComponent(a.area.toLowerCase().replace(/\s+/g, '-'))}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }
  for (const d of developers as { slug: string }[]) {
    entries.push({
      url: `${SITE_URL}/developers/${d.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }

  return entries
}
