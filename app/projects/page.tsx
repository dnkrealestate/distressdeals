import type { Metadata } from 'next'
import { resolveSeo } from '@/lib/seo'
import ProjectsListClient from './ProjectsListClient'
import { quickLinksAPI } from '@/lib/api'
import { getContentPage } from '@/lib/contentPages'
import { GUIDE_NEW_PROJECTS } from '@/lib/guideContent'
import { tagHeadline, TAG_LABELS } from '@/lib/listingTags'
import MoreSearches from '@/components/listing/MoreSearches'
import GuideSection from '@/components/listing/GuideSection'

export async function generateMetadata({ searchParams }: { searchParams?: { tag?: string } }): Promise<Metadata> {
  const seo = await resolveSeo('projects', {
    title: 'Off-Plan Projects Dubai | Prices & Payment Plans',
    description: "Explore Dubai's newest off-plan developments — payment plans, handover dates, and prices from leading developers.",
    path: '/projects',
  })
  const tag = searchParams?.tag && TAG_LABELS[searchParams.tag] ? searchParams.tag : ''
  if (tag) {
    // A "More searches" page (/projects?tag=luxury) gets its own title and canonical.
    const h = tagHeadline(tag, 'projects'); const t = h.charAt(0).toUpperCase() + h.slice(1)
    const d = `${t} — verified off-plan projects direct from the developer on Distress Deals UAE: prices, payment plans and handover dates.`
    return { ...seo, title: t, description: d, alternates: { canonical: `/projects?tag=${tag}` }, twitter: { card: 'summary_large_image', title: t, description: d } }
  }
  return { ...seo, twitter: { card: 'summary_large_image', title: seo.title as string, description: seo.description as string } }
}

export default async function ProjectsPage() {
  const [quickLinks, guide] = await Promise.all([
    quickLinksAPI.get('projects').then(r => r.data.success ? r.data.data : null).catch(() => null),
    getContentPage('guide-new-projects', GUIDE_NEW_PROJECTS),
  ])
  return <ProjectsListClient bottom={<><MoreSearches data={quickLinks} /><GuideSection content={guide} /></>} />
}
