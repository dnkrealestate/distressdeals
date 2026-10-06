import type { MetadataRoute } from 'next'
import { propertyAPI, blogAPI, newsAPI, projectAPI, communityContentAPI, buildingContentAPI, placeAPI, areaContentAPI } from '@/lib/api'
import { EXPLORE_SECTIONS, EMIRATES, sectionHref, placeHref } from '@/lib/explore'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.distressdealsuae.com'

// Static, always-present routes — everything else below is generated from
// live data so new listings/posts/projects show up without a manual edit.
const STATIC_ROUTES = [
  '', '/for-sale', '/for-rent', '/projects', '/insights', '/blog', '/news',
  '/about', '/areas', '/communities', '/buildings', '/explore',
  '/explore/attractions', '/explore/food', '/explore/malls', '/explore/markets', '/explore/hotels', '/explore/activities', '/mortgage', '/developers',
  '/contact',
  '/distress-sale-dubai', '/distressed-villas-dubai', '/dubai-property-auctions',
  '/distressed-apartments-dubai', '/distressed-property-for-sale', '/panic-selling-dubai',
  '/sell-property-fast-dubai', '/free-property-valuation-dubai',
  '/privacy', '/terms', '/cookies', '/delete-account', '/sitemap',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages carry no "last changed" date — a made-up one (today, on every request) teaches search engines to ignore
  // the field. Only the homepage, whose listings change every day, says today.
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map(path => ({
    url: `${SITE_URL}${path}`,
    ...(path === '' ? { lastModified: new Date() } : {}),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.6,
  }))

  // Each fetch is isolated — one failing source (e.g. the API being briefly
  // down) shouldn't take the whole sitemap down with it.
  // The API pages its results (up to 50 properties / 100 projects per request), so walk every page.
  const allPages = async (get: (page: number) => Promise<any>, max = 40): Promise<any[]> => {
    const out: any[] = []
    for (let page = 1; page <= max; page++) {
      const d = await get(page).then(r => r.data.data).catch(() => null)
      const rows = d?.data || []
      out.push(...rows)
      if (!rows.length || page >= (d?.totalPages || 1)) break
    }
    return out
  }
  const [properties, posts, articles, projects] = await Promise.all([
    allPages(page => propertyAPI.getAll({ limit: 50, page })),
    blogAPI.getAll({ limit: 500 }).then(r => r.data.data?.data || r.data.data || []).catch(() => []),
    newsAPI.getAll({ limit: 500 }).then(r => r.data.data?.data || r.data.data || []).catch(() => []),
    allPages(page => projectAPI.getAll({ limit: 100, page })),
  ])

  // Every area with a page — with listings or a written guide — dated by its guide's last edit when it has one.
  const areas = await propertyAPI.getAllAreas().then(r => r.data.data || []).catch(() => [])
  const guideEdited = new Map<string, string>(await areaContentAPI.getAll().then(r => (r.data.data || []).map((g: any) => [g.slug, g.updatedAt])).catch(() => []))
  const developers = await projectAPI.getAllDevelopers().then(r => r.data.data || []).catch(() => [])
  const communities = await communityContentAPI.getAll({ fields: 'card' }).then(r => r.data.data || []).catch(() => [])
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
  for (const a of areas as { area: string; slug?: string }[]) {
    if (!a.area) continue
    const slug = a.slug || a.area.toLowerCase().trim().replace(/\s+/g, '-')
    const edited = guideEdited.get(slug)
    entries.push({
      url: `${SITE_URL}/areas/${encodeURIComponent(slug)}`,
      ...(edited ? { lastModified: new Date(edited) } : {}),
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

  // UAE Explore: every place, plus each section's per-emirate page.
  const places = await allPages(page => placeAPI.getAll({ limit: 60, page, sort: 'name' }), 60)
  for (const p of places as { category: string; slug: string; emirate: string; updatedAt?: string }[]) {
    entries.push({ url: `${SITE_URL}${placeHref(p)}`, ...(p.updatedAt ? { lastModified: new Date(p.updatedAt) } : {}), changeFrequency: 'monthly', priority: 0.6 })
  }
  for (const s of EXPLORE_SECTIONS) for (const e of EMIRATES) {
    if (!places.some((p: any) => p.category === s.key && p.emirate === e)) continue
    entries.push({ url: `${SITE_URL}${sectionHref(s, e)}`, changeFrequency: 'weekly', priority: 0.6 })
  }

  return entries
}
