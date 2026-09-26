import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Building2, MapPin, Layers, Globe, CalendarDays, Hammer, ArrowUpRight } from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import ProjectCard from '@/components/buyer/ProjectCard'
import { projectAPI, developerAPI } from '@/lib/api'
import { formatPrice, isHandedOver } from '@/lib/utils'
import FaqSection, { type Faq } from '@/components/shared/FaqSection'
import LinkPagination from '@/components/shared/LinkPagination'
import type { DeveloperWithStats, Project } from '@/types'

const SITE_URL = 'https://www.distressdealsuae.com'

const getDeveloper = cache(async (slug: string): Promise<DeveloperWithStats | null> => {
  try {
    const res = await developerAPI.getBySlug(slug)
    return res.data.success ? res.data.data : null
  } catch {
    return null
  }
})

const getDeveloperProjects = cache(async (developer: string): Promise<Project[]> => {
  try {
    const res = await projectAPI.getAll({ developer, limit: 100 })
    return res.data.success ? res.data.data.data || [] : []
  } catch {
    return []
  }
})

const PER_PAGE = 40
const pageFrom = (sp?: { page?: string }) => Math.max(1, Math.floor(Number(sp?.page)) || 1)

// One page of this developer's projects (40 a page) for the list.
const getProjectPage = cache(async (developer: string, page: number): Promise<{ data: Project[]; total: number; totalPages: number }> => {
  try {
    const res = await projectAPI.getAll({ developer, page, limit: PER_PAGE })
    const d = res.data.success ? res.data.data : null
    return { data: d?.data || [], total: d?.total || 0, totalPages: d?.totalPages || 1 }
  } catch {
    return { data: [], total: 0, totalPages: 1 }
  }
})

export async function generateMetadata({ params, searchParams }: { params: { slug: string }; searchParams?: { page?: string } }): Promise<Metadata> {
  const dev = await getDeveloper(params.slug)
  if (!dev) return { title: 'Developer Not Found' }

  // Admin-editable SEO (written automatically from live projects when empty — see backend utils/entitySeo).
  const title = dev.metaTitle || `${dev.name} — Off-Plan Projects in Dubai`
  const description = dev.metaDescription || dev.description?.slice(0, 158) || `${dev.projectCount} project${dev.projectCount === 1 ? '' : 's'} by ${dev.name}, starting from ${formatPrice(dev.minPriceFrom)}.`
  const keywords = [dev.focusKeyword, ...(dev.seoKeywords || [])].filter(Boolean) as string[]

  return {
    title,
    description,
    ...(keywords.length ? { keywords } : {}),
    // Page 2+ of the list is its own crawlable page.
    alternates: { canonical: `/developers/${dev.slug}${pageFrom(searchParams) > 1 ? `?page=${pageFrom(searchParams)}` : ''}` },
    openGraph: { title, description, type: 'website', url: `/developers/${dev.slug}`, ...(dev.logo ? { images: [{ url: dev.logo, alt: `${dev.name} logo` }] } : {}) },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function DeveloperDetailPage({ params, searchParams }: { params: { slug: string }; searchParams?: { page?: string } }) {
  const dev = await getDeveloper(params.slug)
  if (!dev) notFound()

  const page = pageFrom(searchParams)
  // `projects` = a broad sample (FAQs, banner photos); `listPage` = the 40 on this page.
  const [projects, listPage] = await Promise.all([getDeveloperProjects(dev.name), getProjectPage(dev.name, page)])
  const banner = Array.from(new Set(projects.map(p => p.coverImage || p.images?.[0]?.url).filter(Boolean) as string[])).slice(0, 5)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Developers', item: `${SITE_URL}/developers` },
      { '@type': 'ListItem', position: 3, name: dev.name, item: `${SITE_URL}/developers/${dev.slug}` },
    ],
  }
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/developers/${dev.slug}#organization`,
    name: dev.name,
    ...(dev.description ? { description: dev.description.slice(0, 500) } : {}),
    ...(dev.website ? { url: dev.website, sameAs: [dev.website] } : {}),
    ...(dev.logo ? { logo: dev.logo, image: dev.logo } : {}),
    ...(dev.establishedYear ? { foundingDate: String(dev.establishedYear) } : {}),
    ...(dev.headquarters ? { address: { '@type': 'PostalAddress', addressLocality: dev.headquarters.split(',')[0].trim(), addressCountry: 'AE' } } : {}),
    ...(dev.seoKeywords?.length ? { knowsAbout: dev.seoKeywords.slice(0, 5) } : {}),
  }
  // The projects on this page, as a list search engines can read.
  const listJsonLd = listPage.data.length ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Projects by ${dev.name}`,
    numberOfItems: listPage.total,
    itemListElement: listPage.data.map((p, i) => ({ '@type': 'ListItem', position: (page - 1) * PER_PAGE + i + 1, url: `${SITE_URL}/projects/${p.slug}`, name: p.title })),
  } : null

  // FAQs answered from live data — always current, never invented.
  const areas = Array.from(new Set(projects.map(p => p.area).filter(Boolean)))
  const offPlan = projects.filter(p => p.status !== 'ready' && !isHandedOver(p))
  const plans = Array.from(new Set(projects.map(p => (p.paymentPlan || '').trim()).filter(Boolean))).slice(0, 4)
  const upcoming = offPlan.filter(p => p.handoverYear).sort((a, b) => (a.handoverYear! - b.handoverYear!) || String(a.handoverQuarter).localeCompare(String(b.handoverQuarter)))
  const list = (a: string[]) => a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`
  const faqs: Faq[] = [
    projects.length ? {
      q: `How many ${dev.name} projects are listed on Distress Deals UAE?`,
      a: `We currently list ${projects.length} ${dev.name} project${projects.length === 1 ? '' : 's'}${offPlan.length ? `, ${offPlan.length} of them off-plan` : ''}${areas.length ? `, in ${list(areas.slice(0, 5))}${areas.length > 5 ? ' and more' : ''}` : ''}.`,
    } : { q: '', a: '' },
    dev.minPriceFrom > 0 ? {
      q: `What is the starting price of ${dev.name} projects?`,
      a: `${dev.name} projects on Distress Deals UAE start from ${formatPrice(dev.minPriceFrom)}. Prices vary by project, unit type and floor — each project page shows its current starting price.`,
    } : { q: '', a: '' },
    plans.length ? {
      q: `Do ${dev.name} projects come with payment plans?`,
      a: `Yes. Current ${dev.name} projects offer payment plans such as ${list(plans)}. The exact plan for each project is listed on its page.`,
    } : { q: '', a: '' },
    upcoming.length ? {
      q: `When is the next ${dev.name} handover?`,
      a: `The earliest upcoming handover among the listed projects is ${[upcoming[0].handoverQuarter, upcoming[0].handoverYear].filter(Boolean).join(' ')} for ${upcoming[0].title}.`,
    } : { q: '', a: '' },
    (dev.establishedYear || dev.headquarters) ? {
      q: `When was ${dev.name} founded?`,
      a: [dev.establishedYear && `${dev.name} was founded in ${dev.establishedYear}`, dev.headquarters && `is headquartered in ${dev.headquarters}`].filter(Boolean).join(' and ') + '.',
    } : { q: '', a: '' },
    {
      q: `How do I buy a ${dev.name} property through Distress Deals UAE?`,
      a: `Open any ${dev.name} project and send an enquiry. A dedicated Distress Deals UAE agent handles it from the first message to handover, with verified prices, floor plans and payment plan details.`,
    },
  ]

  return (
    <div className="page overflow-x-hidden">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      {listJsonLd && (
        // eslint-disable-next-line react/no-danger
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd) }} />
      )}

      <Navbar />

      {/* ── Banner: their projects' photos, blurred, fading into the page — logo big, name and facts on top ── */}
      <section className="relative overflow-hidden" style={{ background: '#0B1220' }}>
        {banner.length > 0 ? (
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${Math.min(banner.length, 3)}, minmax(0, 1fr))` }} aria-hidden>
            {banner.slice(0, 3).map(src => (
              <div key={src} className="relative overflow-hidden">
                <Image src={src} alt="" fill priority sizes="50vw" className="object-cover" style={{ filter: 'blur(6px) saturate(1.1)', transform: 'scale(1.12)' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 0%, rgba(203,1,1,0.35), transparent 60%), linear-gradient(135deg, #0B1220, #1E293B)' }} aria-hidden />
        )}
        {/* Readability + the soft fade into the page below */}
        <div className="absolute inset-0" aria-hidden style={{ background: 'linear-gradient(90deg, rgba(8,12,24,0.88) 0%, rgba(8,12,24,0.66) 55%, rgba(8,12,24,0.45) 100%)' }} />
        <div className="absolute inset-x-0 bottom-0 h-28" aria-hidden style={{ background: 'linear-gradient(180deg, transparent, var(--bg))' }} />

        <div className="wrap relative z-10 pt-8 pb-20 md:pt-28 md:pb-28">
          <nav className="text-xs mb-5 md:mb-6 flex items-center gap-1.5 flex-wrap" style={{ color: 'rgba(255,255,255,0.65)' }} aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white">Home</Link><span>/</span>
            <Link href="/developers" className="hover:text-white">Developers</Link><span>/</span>
            <span className="text-white">{dev.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
            {/* Logo on white so every logo reads, in light and dark mode */}
            <div className="w-24 h-24 md:w-40 md:h-40 rounded-2xl md:rounded-3xl flex-shrink-0 flex items-center justify-center p-3 md:p-5"
              style={{ background: '#fff', boxShadow: '0 20px 50px -12px rgba(0,0,0,0.55)' }}>
              {dev.logo
                ? <Image src={dev.logo} alt={`${dev.name} logo`} width={160} height={160} priority className="object-contain w-full h-full" />
                : <Building2 size={44} style={{ color: '#CB0101' }} />}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-2" style={{ color: '#FCA5A5' }}>Real estate developer</p>
              <h1 className="text-2xl md:text-[2rem] font-bold leading-tight text-white mb-3">{dev.name}</h1>
              <div className="flex items-center gap-x-4 gap-y-1.5 text-xs flex-wrap mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {dev.headquarters && <span className="inline-flex items-center gap-1.5"><MapPin size={12} /> {dev.headquarters}</span>}
                {dev.establishedYear && <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} /> Since {dev.establishedYear}</span>}
                {dev.website && (
                  <a href={dev.website} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 font-semibold text-white hover:underline">
                    <Globe size={12} /> {dev.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')} <ArrowUpRight size={12} />
                  </a>
                )}
              </div>
              {dev.description && (
                <p className="text-sm md:text-[15px] leading-relaxed max-w-3xl line-clamp-3" style={{ color: 'rgba(255,255,255,0.88)' }}>
                  {dev.description}
                </p>
              )}
            </div>
          </div>

          {/* Key numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 max-w-3xl">
            {[
              { icon: Layers, v: String(dev.projectCount), l: dev.projectCount === 1 ? 'Project' : 'Projects' },
              { icon: Hammer, v: String(projects.filter(p => p.status !== 'ready' && !isHandedOver(p)).length), l: 'Off-plan' },
              { icon: MapPin, v: String(dev.areas?.length || 0), l: (dev.areas?.length || 0) === 1 ? 'Area' : 'Areas' },
              { icon: Building2, v: dev.minPriceFrom > 0 ? formatPrice(dev.minPriceFrom) : '—', l: 'Starting from' },
            ].map(({ icon: Icon, v, l }) => (
              <div key={l} className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.16)', backdropFilter: 'blur(10px)' }}>
                <p className="text-lg md:text-xl font-bold text-white leading-tight">{v}</p>
                <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.7)' }}><Icon size={11} /> {l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section pb-20">
        <div className="wrap">
          <h2 id="projects" className="text-lg font-bold mb-6 scroll-mt-24" style={{ color: 'var(--text)' }}>
            Projects by {dev.name}{listPage.total > 0 && <span className="font-normal text-sm ml-2" style={{ color: 'var(--text-muted)' }}>· {listPage.total}</span>}
          </h2>
          {listPage.data.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listPage.data.map((project, i) => <ProjectCard key={project._id} project={project} delay={Math.min(i, 8) * 0.05} />)}
              </div>
              <LinkPagination page={page} totalPages={listPage.totalPages} basePath={`/developers/${dev.slug}`} anchor="projects"
                total={listPage.total} perPage={PER_PAGE} itemLabel={listPage.total === 1 ? 'project' : 'projects'} />
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No live projects from {dev.name} right now.</p>
            </div>
          )}
        </div>
      </section>

      <FaqSection title={`${dev.name}: frequently asked questions`} faqs={faqs} />

      <Footer />
    </div>
  )
}
