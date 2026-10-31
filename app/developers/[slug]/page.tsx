import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Building2, MapPin, Layers, Globe, CalendarDays, Hammer, ArrowUpRight } from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import ProjectCard from '@/components/buyer/ProjectCard'
import { DeveloperOfferBanner } from '@/components/buyer/OfferParts'
import { projectAPI, developerAPI } from '@/lib/api'
import { formatPrice, isHandedOver } from '@/lib/utils'
import FaqSection, { type Faq } from '@/components/shared/FaqSection'
import LinkPagination from '@/components/shared/LinkPagination'
import type { DeveloperWithStats, Project } from '@/types'
import { DEFAULT_SHARE_IMAGE, fitTitle, fitDescription } from '@/lib/seo'
import Price from '@/components/currency/Price'
import { projectForCard } from '@/lib/cardData'
import { groupPrimaries } from '@/lib/indexability'
import { projectMainPhoto } from '@/lib/projectPhotos'

// Edited in the admin — serve the latest version (rebuilt at most every 60 s).
export const revalidate = 60

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

  const pg = pageFrom(searchParams)
  return {
    title: fitTitle(pg > 1 ? `${title} – Page ${pg}` : title),
    description: fitDescription(pg > 1 ? `Page ${pg}: ${description}` : description),
    ...(keywords.length ? { keywords } : {}),
    // Page 2+ of the list is its own crawlable page.
    alternates: { canonical: `/developers/${dev.slug}${pageFrom(searchParams) > 1 ? `?page=${pageFrom(searchParams)}` : ''}` },
    openGraph: { title, description, type: 'website', url: `/developers/${dev.slug}`, images: [DEFAULT_SHARE_IMAGE] },
    twitter: { card: 'summary_large_image', title, description, images: [DEFAULT_SHARE_IMAGE.url] },
  }
}

export default async function DeveloperDetailPage({ params, searchParams }: { params: { slug: string }; searchParams?: { page?: string } }) {
  const dev = await getDeveloper(params.slug)
  if (!dev) notFound()

  const page = pageFrom(searchParams)
  // `projects` = a broad sample (FAQs, banner photos); `listPage` = the 40 on this page.
  const [projects, listPage] = await Promise.all([getDeveloperProjects(dev.name), getProjectPage(dev.name, page)])
  const banner = Array.from(new Set(projects.map(p => projectMainPhoto(p)).filter(Boolean) as string[])).slice(0, 5)

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
  // One project is often entered once per unit type — count projects, not records.
  const offPlan = groupPrimaries(projects.filter(p => p.status !== 'ready' && !isHandedOver(p)))
  const projectTotal = dev.projectCount || groupPrimaries(projects).length
  const unitTotal = dev.unitCount || listPage.total
  const unitsNote = unitTotal > projectTotal ? ` (${unitTotal} unit types)` : ''
  const plans = Array.from(new Set(projects.map(p => (p.paymentPlan || '').trim()).filter(Boolean))).slice(0, 4)
  const upcoming = offPlan.filter(p => p.handoverYear).sort((a, b) => (a.handoverYear! - b.handoverYear!) || String(a.handoverQuarter).localeCompare(String(b.handoverQuarter)))
  const list = (a: string[]) => a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`
  const faqs: Faq[] = [
    projectTotal ? {
      q: `How many ${dev.name} projects are listed on Distress Deals UAE?`,
      a: `We currently list ${projectTotal} ${dev.name} project${projectTotal === 1 ? '' : 's'}${unitsNote}${offPlan.length ? `, ${offPlan.length} of them off-plan` : ''}${areas.length ? `, in ${list(areas.slice(0, 5))}${areas.length > 5 ? ' and more' : ''}` : ''}.`,
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
      a: `Open any ${dev.name} project and send an enquiry. The Distress Deals UAE team handles it from the first message to handover, with verified prices, floor plans and payment plan details.`,
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

      {/* ── Banner: a sharp mosaic of their projects' photos, the logo card overlapping it, then name, facts and numbers ── */}
      <section className="wrap pt-5 md:pt-8">
        <nav className="text-xs mb-4 flex items-center gap-1.5 flex-wrap" style={{ color: 'var(--text-muted)' }} aria-label="Breadcrumb">
          <Link href="/" className="hover:underline">Home</Link><span aria-hidden>/</span>
          <Link href="/developers" className="hover:underline">Developers</Link><span aria-hidden>/</span>
          <span style={{ color: 'var(--text)' }}>{dev.name}</span>
        </nav>

        <div className={`relative rounded-3xl overflow-hidden h-[220px] sm:h-[300px] md:h-[380px] grid gap-1.5${banner.length > 1 ? ' md:grid-cols-[2fr_1fr] md:grid-rows-2' : ''}`}
          style={{ background: 'var(--bg)' }}>{/* the gaps between photos take the page colour (light / dark theme) */}
          {banner.length > 0 ? (
            <>
              {/* The first photo is the page's main image (LCP): fetched early, sized to the space it fills */}
              <div className={`relative${banner.length > 1 ? ' md:row-span-2' : ''}`} style={{ background: 'var(--bg-alt)' }}>
                <Image src={banner[0]} alt={`A project by ${dev.name}`} fill priority quality={70} sizes="(max-width:768px) 100vw, 66vw" className="object-cover" />
              </div>
              {banner.slice(1, 3).map((src, i, rest) => (
                <div key={src} className={`relative hidden md:block${rest.length === 1 ? ' row-span-2' : ''}`} style={{ background: 'var(--bg-alt)' }}>
                  <Image src={src} alt={`A project by ${dev.name}`} fill quality={60} sizes="34vw" className="object-cover" />
                </div>
              ))}
            </>
          ) : (
            <div className="absolute inset-0" aria-hidden style={{ background: 'radial-gradient(ellipse at 20% 0%, rgba(203,1,1,0.45), transparent 60%), linear-gradient(135deg, #CB0101, #FD7147)' }} />
          )}
          {/* Darker at the bottom so the count reads on any photo */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%)' }} />
          {dev.projectCount > 0 && (
            <a href="#projects" className="absolute right-3 bottom-3 md:right-5 md:bottom-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/70 transition-colors"
              style={{ background: 'rgba(0,0,0,0.55)' }}>
              <Building2 size={13} /> {projectTotal} {projectTotal === 1 ? 'project' : 'projects'}{unitTotal > projectTotal ? ` · ${unitTotal} unit types` : ''}
            </a>
          )}
        </div>

        {/* The logo overlaps the photo; the name block starts just below it, never on the photo */}
        <div className="relative px-4 md:px-8 -mt-12 md:-mt-16 flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
          {/* Logo on white so every logo reads, in light and dark mode */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl md:rounded-3xl flex-shrink-0 flex items-center justify-center p-3 md:p-4"
            style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 16px 40px -14px rgba(15,23,42,0.35)' }}>
            {dev.logo
              ? <Image src={dev.logo} alt={`${dev.name} logo`} width={128} height={128} className="object-contain w-full h-full" />
              : <Building2 size={40} style={{ color: '#CB0101' }} />}
          </div>
          <div className="min-w-0 md:pt-[78px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--teal)' }}>Real estate developer</p>
            <h1 className="text-2xl md:text-[2.1rem] font-bold leading-tight mb-2" style={{ color: 'var(--text)' }}>{dev.name}</h1>
            <div className="flex items-center gap-x-4 gap-y-1.5 text-sm flex-wrap" style={{ color: 'var(--text-mid)' }}>
              {dev.headquarters && <span className="inline-flex items-center gap-1.5"><MapPin size={14} style={{ color: 'var(--text-muted)' }} /> {dev.headquarters}</span>}
              {dev.establishedYear && <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} style={{ color: 'var(--text-muted)' }} /> Since {dev.establishedYear}</span>}
              {dev.website && (
                <a href={dev.website} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 font-semibold hover:underline" style={{ color: 'var(--teal)' }}>
                  <Globe size={14} /> {dev.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')} <ArrowUpRight size={13} />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className={`mt-7 grid gap-5 md:px-8${dev.description ? ' lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]' : ''}`}>
          {/* Key numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 content-start">
            {[
              // A project can hold several unit types (1BR, 2BR, villa…) — both numbers shown so neither is mistaken for the other
              { icon: Building2, v: String(projectTotal), l: projectTotal === 1 ? 'Project' : 'Projects' },
              { icon: Layers, v: String(unitTotal), l: unitTotal === 1 ? 'Unit type' : 'Unit types' },
              { icon: MapPin, v: String(dev.areas?.length || 0), l: (dev.areas?.length || 0) === 1 ? 'Area' : 'Areas' },
              { icon: Hammer, v: <Price aed={dev.minPriceFrom} />, l: 'Starting from' },
            ].map(({ icon: Icon, v, l }) => (
              <div key={l} className="card px-4 py-3.5 flex items-center gap-3">
                <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.08)' }}>
                  <Icon size={16} style={{ color: 'var(--teal)' }} />
                </span>
                <span className="min-w-0">
                  <span className="block text-lg font-bold leading-tight truncate" style={{ color: 'var(--text)' }}>{v}</span>
                  <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{l}</span>
                </span>
              </div>
            ))}
          </div>

          {dev.description && (
            <div className="card p-5">
              <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--text)' }}>About {dev.name}</h2>
              {/* Full text is in the page; long ones show ~6 lines with a no-JS "Read more" (native <details>) */}
              {dev.description.length > 420 ? (
                <details className="group">
                  <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                    <p className="text-sm leading-relaxed line-clamp-6 group-open:line-clamp-none" style={{ color: 'var(--text-mid)' }}>{dev.description}</p>
                    <span className="inline-block mt-2 text-sm font-semibold" style={{ color: 'var(--teal)' }}>
                      <span className="group-open:hidden">Read more</span><span className="hidden group-open:inline">Show less</span>
                    </span>
                  </summary>
                </details>
              ) : (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-mid)' }}>{dev.description}</p>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="section pb-20">
        <div className="wrap">
          {/* The developer's offer on all its projects — renders nothing when none is running */}
          <DeveloperOfferBanner offer={dev.offer} name={dev.name} className="mb-8" />
          <h2 id="projects" className="text-lg font-bold mb-6 scroll-mt-24" style={{ color: 'var(--text)' }}>
            Projects by {dev.name}{listPage.total > 0 && <span className="font-normal text-sm ml-2" style={{ color: 'var(--text-muted)' }}>· {unitTotal} unit type{unitTotal === 1 ? '' : 's'} in {projectTotal} project{projectTotal === 1 ? '' : 's'}</span>}
          </h2>
          {listPage.data.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listPage.data.map((project, i) => <ProjectCard key={project._id} project={projectForCard(project)} delay={Math.min(i, 8) * 0.05} />)}
              </div>
              <LinkPagination page={page} totalPages={listPage.totalPages} basePath={`/developers/${dev.slug}`} anchor="projects"
                total={listPage.total} perPage={PER_PAGE} itemLabel={listPage.total === 1 ? 'unit type' : 'unit types'} />
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
