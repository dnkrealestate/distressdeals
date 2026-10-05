import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, TrendingUp, Tag, Home as HomeIcon, Sparkles, Layers } from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import ReviewsSection from '@/components/shared/ReviewsSection'
import Footer from '@/components/layouts/Footer'
import PropertyCard from '@/components/buyer/PropertyCard'
import ProjectCard from '@/components/buyer/ProjectCard'
import LinkPagination from '@/components/shared/LinkPagination'
import { propertyAPI, areaContentAPI, projectAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { HOME_ICON_MAP } from '@/lib/homeIcons'
import type { AreaStats, AreaContentWithStats, Property, Project } from '@/types'
import { shareImages } from '@/lib/seo'
import FaqSection, { type Faq } from '@/components/shared/FaqSection'
import RealEstateLinks from '@/components/shared/RealEstateLinks'

// Edited in the admin — serve the latest version (rebuilt at most every 60 s).
export const revalidate = 60

const SITE_URL = 'https://www.distressdealsuae.com'

const getArea = cache(async (slug: string): Promise<AreaStats | null> => {
  try {
    const res = await propertyAPI.getAreaBySlug(slug)
    return res.data.success ? res.data.data : null
  } catch {
    return null
  }
})

// Curated "area insights" copy is optional — an area with live listings but
// no admin-written profile yet still renders the page fine, just without
// this extra content, so this must never be what gates notFound().
const getAreaContent = cache(async (slug: string): Promise<AreaContentWithStats | null> => {
  try {
    const res = await areaContentAPI.getBySlug(slug)
    return res.data.success ? res.data.data : null
  } catch {
    return null
  }
})

const PER_PAGE = 40
type SP = { page?: string; pp?: string }
const num = (v?: string) => Math.max(1, Math.floor(Number(v)) || 1)
type Paged<T> = { data: T[]; total: number; totalPages: number }
const EMPTY = { data: [], total: 0, totalPages: 1 }

// 40 listings a page (?page=), 40 new projects a page (?pp=) — each list pages on its own.
const getAreaListings = cache(async (area: string, page: number): Promise<Paged<Property>> => {
  try {
    const res = await propertyAPI.getAll({ area, page, limit: PER_PAGE })
    const d = res.data.success ? res.data.data : null
    return d ? { data: d.data || [], total: d.total || 0, totalPages: d.totalPages || 1 } : EMPTY
  } catch {
    return EMPTY
  }
})

const getAreaProjects = cache(async (area: string, page: number): Promise<Paged<Project>> => {
  try {
    const res = await projectAPI.getAll({ area, page, limit: PER_PAGE })
    const d = res.data.success ? res.data.data : null
    return d ? { data: d.data || [], total: d.total || 0, totalPages: d.totalPages || 1 } : EMPTY
  } catch {
    return EMPTY
  }
})

export async function generateMetadata({ params, searchParams }: { params: { slug: string }; searchParams?: SP }): Promise<Metadata> {
  const area = await getArea(params.slug)
  if (!area) return { title: 'Area Not Found' }

  const content = await getAreaContent(params.slug)
  const emirate = content?.emirate || area.emirate || 'Dubai'
  const title = content?.metaTitle || `Properties for Sale & Rent in ${area.area}, ${emirate}`
  const description = content?.metaDescription || (content?.overview
    ? content.overview.slice(0, 155)
    : area.count > 0
      ? `${area.count} verified listing${area.count === 1 ? '' : 's'} in ${area.area} — average price ${formatPrice(Math.round(area.avgPrice))}. Every listing verified, managed end-to-end by Distress Deals UAE.`
      : `Apartments, villas and off-plan projects for sale and rent in ${area.area}, ${emirate} — area guide, property types and what it is like to live there.`)
  const keywords = content?.seoKeywords?.length
    ? [content.focusKeyword || `${area.area} properties`, ...content.seoKeywords]
    : [`properties for sale in ${area.area}`, `apartments for sale in ${area.area}`, `apartments for rent in ${area.area}`, `${area.area} property prices`, `off-plan projects in ${area.area}`, `${area.area} ${emirate} real estate`]

  return {
    title,
    description,
    keywords,
    robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    alternates: { canonical: `/areas/${area.slug}${num(searchParams?.page) > 1 ? `?page=${num(searchParams?.page)}` : ''}` },
    openGraph: { title, description, type: 'website', url: `/areas/${area.slug}`, images: shareImages(content?.heroImage) },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function AreaDetailPage({ params, searchParams }: { params: { slug: string }; searchParams?: SP }) {
  const area = await getArea(params.slug)
  if (!area) notFound()

  const page = num(searchParams?.page), pPage = num(searchParams?.pp)
  const [content, listingPage, projectPage] = await Promise.all([
    getAreaContent(params.slug),
    getAreaListings(area.area, page),
    getAreaProjects(area.area, pPage),
  ])
  const listings = listingPage.data
  const emirate = content?.emirate || area.emirate || 'Dubai'
  const projectTotal = projectPage.total || area.projectCount || 0
  const cheapestProject = projectPage.data.map(p => p.priceFrom).filter(Boolean).sort((a, b) => a - b)[0] || area.projectsFrom || 0
  const devs = Array.from(new Set(projectPage.data.map(p => p.developer).filter(Boolean))).slice(0, 4)
  const listOf = (a: string[]) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`)
  // Written questions first, then answers worked out from the live listings and projects — never invented.
  const faqs: Faq[] = [
    ...(content?.faqs || []),
    { q: `Where is ${area.area}?`, a: `${area.area} is in the emirate of ${emirate}, United Arab Emirates.` },
    area.count > 0 ? { q: `How many properties are for sale and rent in ${area.area}?`, a: `Distress Deals UAE currently lists ${area.count} verified propert${area.count === 1 ? 'y' : 'ies'} in ${area.area}${area.saleCount || area.rentCount ? ` — ${area.saleCount} for sale and ${area.rentCount} for rent` : ''}.` } : { q: '', a: '' },
    area.avgPrice > 0 ? { q: `What is the average property price in ${area.area}?`, a: `Across our current listings the average asking price in ${area.area} is about ${formatPrice(Math.round(area.avgPrice))}${area.avgPricePerSqft ? `, or roughly AED ${Math.round(area.avgPricePerSqft).toLocaleString()} per square foot` : ''}. Prices depend on the property type, size, view and condition.` } : { q: '', a: '' },
    projectTotal > 0 ? { q: `Are there off-plan projects in ${area.area}?`, a: `Yes — ${projectTotal} new project${projectTotal === 1 ? '' : 's'}${devs.length ? ` by ${listOf(devs)}` : ''}${cheapestProject ? `, with prices starting from ${formatPrice(cheapestProject)}` : ''}.` } : { q: '', a: '' },
    { q: `How do I buy a property in ${area.area}?`, a: `Choose a listing or project in ${area.area} and tap “I’m interested”. A Distress Deals UAE advisor contacts you, arranges a viewing and handles the paperwork with the seller or developer through to the title deed.` },
  ].filter((f, i, all) => f.q && all.findIndex(x => x.q.toLowerCase() === f.q.toLowerCase()) === i)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Area Guides', item: `${SITE_URL}/areas` },
      { '@type': 'ListItem', position: 3, name: area.area, item: `${SITE_URL}/areas/${area.slug}` },
    ],
  }
  const placeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: area.area,
    ...(content?.heroImage ? { image: content.heroImage } : {}),
    ...(content?.overview ? { description: content.overview.slice(0, 500) } : {}),
    address: { '@type': 'PostalAddress', addressLocality: area.area, addressRegion: emirate, addressCountry: 'AE' },
    containedInPlace: { '@type': 'AdministrativeArea', name: `Emirate of ${emirate}` },
  }

  const stats = [
    { label: 'Verified Listings', value: area.count.toLocaleString(), icon: HomeIcon },
    // With no resale listings yet, the useful numbers are the new projects and where their prices start.
    area.count > 0
      ? { label: 'Average Price', value: formatPrice(Math.round(area.avgPrice)), icon: TrendingUp }
      : { label: 'New Projects', value: projectTotal.toLocaleString(), icon: TrendingUp },
    area.count > 0
      ? { label: 'Avg. Price / sqft', value: area.avgPricePerSqft ? `AED ${Math.round(area.avgPricePerSqft).toLocaleString()}` : '—', icon: Tag }
      : { label: 'Projects From', value: cheapestProject ? formatPrice(cheapestProject) : '—', icon: Tag },
  ]

  return (
    <div className="page overflow-x-hidden">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(placeJsonLd) }} />

      <Navbar />

      <section className="relative pt-20 pb-12 overflow-hidden">
        {content?.heroImage ? (
          <>
            <img src={content.heroImage} alt={`${area.area}, ${emirate} — area guide and properties`} title={area.area} fetchPriority="high" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,8,8,0.55) 0%, var(--bg) 92%)' }} />
            {content.heroImageCredit?.name && (
              <a href={content.heroImageCredit.url} target="_blank" rel="noopener noreferrer nofollow"
                className="absolute top-20 right-4 z-10 text-[10px] px-2 py-0.5 rounded hover:underline" style={{ background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.8)' }}>
                Photo: {content.heroImageCredit.name}{content.heroImageCredit.license ? ` · ${content.heroImageCredit.license}` : ''} · Wikimedia Commons
              </a>
            )}
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, var(--bg) 0%, var(--bg-alt) 60%, #EFF6FF 100%)' }} />
        )}

        <div className="wrap relative z-10">
          <p className="text-xs mb-4" style={{ color: content?.heroImage ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)' }}>
            <Link href="/areas" className="hover:underline">Area Guides</Link> / {emirate} / {area.area}
          </p>
          <h1 className="heading-xl mb-3 flex items-center gap-3" style={content?.heroImage ? { color: '#fff' } : undefined}>
            <MapPin size={28} style={{ color: 'var(--teal)' }} />
            {area.area}
          </h1>
          <p className="text-base max-w-2xl leading-relaxed mb-10" style={{ color: content?.heroImage ? 'rgba(255,255,255,0.88)' : 'var(--text-muted)' }}>
            {area.count > 0 ? (
              <>
                {area.count} verified propert{area.count === 1 ? 'y' : 'ies'} currently available in {area.area}
                {area.saleCount > 0 && area.rentCount > 0 && ` (${area.saleCount} for sale, ${area.rentCount} for rent)`}.
                Every listing here passed our agent-completion and admin-approval gate — no duplicates, no stale posts.
              </>
            ) : (
              <>Area guide to {area.area}, {emirate}: property types, lifestyle and what is for sale{projectTotal > 0 ? ` — including ${projectTotal} new off-plan project${projectTotal === 1 ? '' : 's'}` : ''}.</>
            )}
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-2xl">
            {stats.map(s => (
              <div key={s.label} className="stat-card" style={content?.heroImage ? { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' } : undefined}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(203,1,1,0.15)', border: '1px solid rgba(203,1,1,0.30)' }}>
                  <s.icon size={16} style={{ color: 'var(--teal)' }} />
                </div>
                <p className="text-lg font-bold" style={{ color: content?.heroImage ? '#fff' : 'var(--text)' }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: content?.heroImage ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {(content?.overview || content?.highlights?.length || content?.amenities?.length) && (
        <section className="pb-4">
          <div className="wrap grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_1fr] gap-8">
            {content?.overview && (
              <div>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Sparkles size={16} style={{ color: 'var(--teal)' }} /> About {area.area}
                </h2>
                <p className="text-sm leading-7 whitespace-pre-line" style={{ color: 'var(--text-mid)' }}>{content.overview}</p>

                {content.sections?.map((s, i) => (
                  <div key={i}>
                    <h2 className="text-base font-bold mt-7 mb-2" style={{ color: 'var(--text)' }}>{s.heading}</h2>
                    <p className="text-sm leading-7 whitespace-pre-line" style={{ color: 'var(--text-mid)' }}>{s.body}</p>
                  </div>
                ))}

                {content.highlights?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-5">
                    {content.highlights.map((h, i) => (
                      <span key={i} className="badge badge-teal text-xs">{h.label}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {content?.amenities?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>Amenities & Nearby</h3>
                <div className="space-y-3">
                  {content.amenities.map((a, i) => {
                    const Icon = HOME_ICON_MAP[a.icon]
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.08)' }}>
                          {Icon && <Icon size={15} style={{ color: 'var(--teal)' }} />}
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-mid)' }}>{a.label}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {content?.communities && content.communities.length > 0 && (
        <section className="pb-4">
          <div className="wrap">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Layers size={14} style={{ color: 'var(--teal)' }} /> Communities in {area.area}
            </h2>
            <div className="flex flex-wrap gap-2">
              {content.communities.map(c => (
                <Link key={c} href={`/buyer/properties?area=${encodeURIComponent(area.area)}&community=${encodeURIComponent(c)}`} className="badge text-xs" style={{ background: 'var(--bg-alt)', color: 'var(--text-mid)', border: '1px solid var(--border)' }}>
                  {c}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section pb-20">
        <div className="wrap">
          <h2 id="listings" className="text-lg font-bold mb-6 scroll-mt-24" style={{ color: 'var(--text)' }}>
            Available Listings in {area.area}{listingPage.total > 0 && <span className="font-normal text-sm ml-2" style={{ color: 'var(--text-muted)' }}>· {listingPage.total}</span>}
          </h2>
          {listings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map(p => <PropertyCard key={p._id} property={p} />)}
              </div>
              <LinkPagination page={page} totalPages={listingPage.totalPages} basePath={`/areas/${area.slug}`} anchor="listings"
                total={listingPage.total} perPage={PER_PAGE} itemLabel={listingPage.total === 1 ? 'listing' : 'listings'} />
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No live listings in {area.area} right now — check back soon.</p>
            </div>
          )}

          {projectPage.data.length > 0 && (
            <>
              <h2 id="projects" className="text-lg font-bold mb-6 mt-14 scroll-mt-24" style={{ color: 'var(--text)' }}>
                New Projects in {area.area}<span className="font-normal text-sm ml-2" style={{ color: 'var(--text-muted)' }}>· {projectPage.total}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectPage.data.map((p, i) => <ProjectCard key={p._id} project={p} markAsProject delay={Math.min(i, 8) * 0.05} />)}
              </div>
              <LinkPagination page={pPage} param="pp" totalPages={projectPage.totalPages} basePath={`/areas/${area.slug}`} anchor="projects"
                total={projectPage.total} perPage={PER_PAGE} itemLabel={projectPage.total === 1 ? 'project' : 'projects'} />
            </>
          )}
        </div>
      </section>

      <RealEstateLinks area={area.area} emirate={emirate} />

      <ReviewsSection type="area" slug={area.slug} name={area.area} />

      <FaqSection title={`${area.area} property: frequently asked questions`} faqs={faqs} />

      <Footer />
    </div>
  )
}
