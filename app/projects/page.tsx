import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolveSeo } from '@/lib/seo'
import ProjectsListClient, { type InitialProjects } from './ProjectsListClient'
import { quickLinksAPI, projectAPI } from '@/lib/api'
import { getContentPage } from '@/lib/contentPages'
import { GUIDE_NEW_PROJECTS } from '@/lib/guideContent'
import { tagHeadline, TAG_LABELS } from '@/lib/listingTags'
import MoreSearches from '@/components/listing/MoreSearches'
import GuideSection from '@/components/listing/GuideSection'
import { projectForCard } from '@/lib/cardData'

type SP = Record<string, string | undefined>
const PER_PAGE = 40   // same as the list (ProjectsListClient `limit`)
const pageOf = (sp?: SP) => Math.max(1, Math.floor(Number(sp?.page) || 1))

export async function generateMetadata({ searchParams }: { searchParams?: SP }): Promise<Metadata> {
  const seo = await resolveSeo('projects', {
    title: 'Off-Plan Projects Dubai | Prices & Payment Plans',
    description: "Explore Dubai's newest off-plan developments — payment plans, handover dates, and prices from leading developers.",
    path: '/projects',
  })
  const page = pageOf(searchParams)
  // Page 2, 3… of the list are pages of their own (own canonical, "Page N" in the title) — never pointed at page 1.
  const paged = (canonical: string, title: string) => page > 1
    ? { canonical: `${canonical}${canonical.includes('?') ? '&' : '?'}page=${page}`, title: /\s\|\s[^|]*distress deals[^|]*$/i.test(title) ? title.replace(/(\s\|\s[^|]*)$/, ` – Page ${page}$1`) : `${title} – Page ${page}` }
    : { canonical, title }
  const tag = searchParams?.tag && TAG_LABELS[searchParams.tag] ? searchParams.tag : ''
  if (tag) {
    // A "More searches" page (/projects?tag=luxury) gets its own title and canonical.
    const h = tagHeadline(tag, 'projects'); const t = h.charAt(0).toUpperCase() + h.slice(1)
    const d = `${t} — verified off-plan projects direct from the developer on Distress Deals UAE: prices, payment plans and handover dates.`
    const p = paged(`/projects?tag=${tag}`, t)
    return { ...seo, title: p.title, description: d, alternates: { canonical: p.canonical }, twitter: { card: 'summary_large_image', title: p.title, description: d } }
  }
  // The admin SEO title may come back as { absolute } (no "| Distress Deals" suffix) — keep that form for page N.
  const absolute = typeof seo.title === 'object' && seo.title && 'absolute' in seo.title ? String(seo.title.absolute) : null
  const p = paged('/projects', absolute ?? String(seo.title))
  const title: Metadata['title'] = absolute !== null ? { absolute: p.title } : p.title
  return { ...seo, title, alternates: { canonical: p.canonical }, twitter: { card: 'summary_large_image', title: p.title, description: seo.description as string } }
}

// The same request the list makes on the client for this URL, done on the server so the first page of cards (and
// their links) is in the HTML. Filters the server can't mirror exactly (price / handover ranges, keyword search) are
// left to the client as before.
async function initialPage(sp?: SP): Promise<InitialProjects | undefined> {
  if (sp?.priceMin || sp?.priceMax || sp?.handoverYear || sp?.handoverYearMin || sp?.handoverYearMax || sp?.handoverQuarter || sp?.q) return undefined
  const params = {
    area: sp?.area || undefined, developer: sp?.developer || undefined, emirate: sp?.emirate || undefined,
    type: sp?.type || undefined, tag: sp?.tag || undefined, community: sp?.community || undefined,
    status: sp?.status || undefined, page: pageOf(sp), limit: PER_PAGE,
  }
  const d = await projectAPI.getAll(params).then(r => (r.data.success ? r.data.data : null)).catch(() => null)
  if (!d) return undefined
  return { projects: (d.data || []).map(projectForCard), total: d.total || 0, totalPages: d.totalPages || 1 }
}

export default async function ProjectsPage({ searchParams }: { searchParams?: SP }) {
  const [quickLinks, guide, initial] = await Promise.all([
    quickLinksAPI.get('projects').then(r => r.data.success ? r.data.data : null).catch(() => null),
    getContentPage('guide-new-projects', GUIDE_NEW_PROJECTS),
    initialPage(searchParams),
  ])
  // A page past the end of the list (?page=999) is a real 404, not an empty 200 ("soft 404").
  if (initial && pageOf(searchParams) > 1 && pageOf(searchParams) > initial.totalPages) notFound()
  return <ProjectsListClient initial={initial} bottom={<><MoreSearches data={quickLinks} /><GuideSection content={guide} /></>} />
}
