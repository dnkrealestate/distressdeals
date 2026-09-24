import type { MetadataRoute } from 'next'
import { propertyAPI, blogAPI, newsAPI, projectAPI, communityContentAPI, buildingContentAPI } from '@/lib/api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.distressdealsuae.com'

// Static, always-present routes — everything else below is generated from
// live data so new listings/posts/projects show up without a manual edit.
const STATIC_ROUTES = [
  '', '/for-sale', '/for-rent', '/projects', '/insights', '/blog', '/news',
  '/about', '/areas', '/communities', '/buildings', '/mortgage', '/developers',
  '/auth/login', '/auth/register', '/seller/register', '/contact',
  '/distress-sale-dubai', '/distressed-villas-dubai', '/dubai-property-auctions',
  '/sell-property-fast-dubai', '/free-property-valuation-dubai',
  '/privacy', '/terms', '/cookies', '/sitemap',
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
  const communities = await communityContentAPI.getAll().then(r => r.data.data || []).catch(() => [])
  const buildings = await buildingContentAPI.getAll().then(r => r.data.data || []).catch(() => [])

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
      lastModified: proj.updatedAt ? new Date(proj.updatedAt) : new Date(proj.createdAt),
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
  for (const d of developers as { slug: string; updatedAt?: string; createdAt?: string }[]) {
    entries.push({
      url: `${SITE_URL}/developers/${d.slug}`,
      lastModified: d.updatedAt || d.createdAt ? new Date(d.updatedAt || d.createdAt!) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }
  for (const c of communities as { slug: string; updatedAt?: string; createdAt?: string }[]) {
    entries.push({
      url: `${SITE_URL}/communities/${c.slug}`,
      lastModified: c.updatedAt || c.createdAt ? new Date(c.updatedAt || c.createdAt!) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }
  for (const b of buildings as { slug: string; updatedAt?: string; createdAt?: string }[]) {
    entries.push({
      url: `${SITE_URL}/buildings/${b.slug}`,
      lastModified: b.updatedAt || b.createdAt ? new Date(b.updatedAt || b.createdAt!) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    })
  }

  return entries
}
