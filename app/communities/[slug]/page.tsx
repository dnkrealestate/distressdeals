import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Layers, MapPin, Sparkles } from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import PropertyCard from '@/components/buyer/PropertyCard'
import { propertyAPI, communityContentAPI, projectAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import ProjectCard from '@/components/buyer/ProjectCard'
import FaqSection, { type Faq } from '@/components/shared/FaqSection'
import LinkPagination from '@/components/shared/LinkPagination'
import { HOME_ICON_MAP } from '@/lib/homeIcons'
import type { CommunityContentWithStats, Property, Project } from '@/types'

const SITE_URL = 'https://www.distressdealsuae.com'

const getCommunity = cache(async (slug: string): Promise<CommunityContentWithStats | null> => {
  try {
    const res = await communityContentAPI.getBySlug(slug)
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

// 40 listings a page (?page=), 40 projects a page (?pp=) — each list pages on its own.
const getCommunityListings = cache(async (name: string, page: number): Promise<Paged<Property>> => {
  try {
    const res = await propertyAPI.getAll({ community: name, page, limit: PER_PAGE })
    const d = res.data.success ? res.data.data : null
    return d ? { data: d.data || [], total: d.total || 0, totalPages: d.totalPages || 1 } : EMPTY
  } catch {
    return EMPTY
  }
})

const getCommunityProjects = cache(async (name: string, page: number): Promise<Paged<Project>> => {
  try {
    const res = await projectAPI.getAll({ community: name, page, limit: PER_PAGE })
    const d = res.data.success ? res.data.data : null
    return d ? { data: d.data || [], total: d.total || 0, totalPages: d.totalPages || 1 } : EMPTY
  } catch {
    return EMPTY
  }
})

export async function generateMetadata({ params, searchParams }: { params: { slug: string }; searchParams?: SP }): Promise<Metadata> {
  const community = await getCommunity(params.slug)
  if (!community) return { title: 'Community Not Found' }

  // Admin-editable SEO (written automatically from live listings when empty — see backend utils/entitySeo).
  const title = community.metaTitle || `${community.name} — Properties & Community Guide`
  const description = community.metaDescription || community.overview?.slice(0, 155) || `${community.count} verified listing${community.count === 1 ? '' : 's'} in ${community.name}.`
  const keywords = [community.focusKeyword, ...(community.seoKeywords || [])].filter(Boolean) as string[]

  return {
    title,
    description,
    ...(keywords.length ? { keywords } : {}),
    alternates: { canonical: `/communities/${community.slug}${num(searchParams?.page) > 1 ? `?page=${num(searchParams?.page)}` : ''}` },
    openGraph: { title, description, type: 'website', url: `/communities/${community.slug}`, ...(community.heroImage ? { images: [community.heroImage] } : {}) },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function CommunityDetailPage({ params, searchParams }: { params: { slug: string }; searchParams?: SP }) {
  const community = await getCommunity(params.slug)
  if (!community) notFound()

  const page = num(searchParams?.page), pPage = num(searchParams?.pp)
  const [listingPage, projectPage] = await Promise.all([getCommunityListings(community.name, page), getCommunityProjects(community.name, pPage)])
  const listings = listingPage.data, projects = projectPage.data

  // The place itself, with its map position — helps local search.
  const placeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: community.name,
    ...(community.overview ? { description: community.overview.slice(0, 500) } : {}),
    ...(community.heroImage ? { image: community.heroImage } : {}),
    address: { '@type': 'PostalAddress', ...(community.area ? { addressLocality: community.area } : {}), addressRegion: community.emirate || 'Dubai', addressCountry: 'AE' },
    ...(community.coordinates?.lat ? { geo: { '@type': 'GeoCoordinates', latitude: community.coordinates.lat, longitude: community.coordinates.lng } } : {}),
    ...(community.amenities?.length ? { amenityFeature: community.amenities.slice(0, 12).map(a => ({ '@type': 'LocationFeatureSpecification', name: a.label, value: true })) } : {}),
  }

  // FAQs answered from live data — always current, never invented.
  const list = (a: string[]) => a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`
  const sale = listings.filter(p => p.listingType === 'sale').length, rent = listings.filter(p => p.listingType === 'rent').length
  const types = Array.from(new Set([...listings.map(p => p.type), ...projects.map(p => p.type)].filter(Boolean) as string[])).slice(0, 4)
  const devs = Array.from(new Set(projects.map(p => p.developer).filter(Boolean))).slice(0, 4)
  const where = [community.area && community.area !== community.name ? community.area : '', community.emirate || 'Dubai'].filter(Boolean).join(', ')
  const faqs: Faq[] = [
    { q: `Where is ${community.name} located?`, a: `${community.name} is in ${where}, UAE.${community.address ? ` Address: ${community.address}.` : ''}` },
    (sale || rent || projects.length) ? {
      q: `What properties are available in ${community.name}?`,
      a: `Distress Deals UAE currently lists ${list([sale && `${sale} for sale`, rent && `${rent} for rent`, projects.length && `${projects.length} new project${projects.length === 1 ? '' : 's'}`].filter(Boolean) as string[])} in ${community.name}${types.length ? `, including ${list(types.map(t => `${t}s`))}` : ''}.`,
    } : { q: '', a: '' },
    community.avgPrice > 0 ? {
      q: `What is the average property price in ${community.name}?`,
      a: `Across our current listings, the average asking price in ${community.name} is about ${formatPrice(Math.round(community.avgPrice))}. Prices depend on the property type, size and view.`,
    } : { q: '', a: '' },
    projects.length ? {
      q: `Are there off-plan projects in ${community.name}?`,
      a: `Yes — ${projects.length} project${projects.length === 1 ? '' : 's'}${devs.length ? ` by ${list(devs)}` : ''}, starting from ${formatPrice(Math.min(...projects.map(p => p.priceFrom).filter(Boolean)))}.`,
    } : { q: '', a: '' },
    community.amenities?.length ? {
      q: `What amenities are near ${community.name}?`,
      a: `Nearby: ${list(community.amenities.slice(0, 8).map(a => a.label))}.`,
    } : { q: '', a: '' },
    community.highlights?.length ? {
      q: `Why live in ${community.name}?`,
      a: `${community.name} is known for ${list(community.highlights.slice(0, 5).map(h => h.label.toLowerCase()))}.`,
    } : { q: '', a: '' },
  ]

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Communities', item: `${SITE_URL}/communities` },
      { '@type': 'ListItem', position: 3, name: community.name, item: `${SITE_URL}/communities/${community.slug}` },
    ],
  }

  return (
    <div className="page overflow-x-hidden">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(placeJsonLd) }} />

      <Navbar />

      <section className="relative pt-20 pb-12 overflow-hidden">
        {community.heroImage ? (
          <>
            <img src={community.heroImage} alt={community.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,8,8,0.55) 0%, var(--bg) 92%)' }} />
            {community.heroImageCredit?.name && (
              <a href={community.heroImageCredit.url} target="_blank" rel="noopener noreferrer nofollow"
                className="absolute top-20 right-4 z-10 text-[10px] px-2 py-0.5 rounded hover:underline" style={{ background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.8)' }}>
                Photo: {community.heroImageCredit.name}{community.heroImageCredit.license ? ` · ${community.heroImageCredit.license}` : ''} · Wikimedia Commons
              </a>
            )}
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, var(--bg) 0%, var(--bg-alt) 60%, #EFF6FF 100%)' }} />
        )}

        <div className="wrap relative z-10">
          <p className="text-xs mb-4" style={{ color: community.heroImage ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)' }}>
            <Link href="/communities" className="hover:underline">Communities</Link>
            {community.area && <> / <Link href={`/areas/${community.area.toLowerCase().trim().replace(/\s+/g, '-')}`} className="hover:underline">{community.area}</Link></>}
            {' '}/ {community.name}
          </p>
          <h1 className="heading-xl mb-3 flex items-center gap-3" style={community.heroImage ? { color: '#fff' } : undefined}>
            <Layers size={28} style={{ color: 'var(--teal)' }} />
            {community.name}
          </h1>
          {community.area && (
            <p className="text-sm flex items-center gap-1.5 mb-6" style={{ color: community.heroImage ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)' }}>
              <MapPin size={13} style={{ color: 'var(--teal)' }} />Within {community.area}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="stat-card" style={community.heroImage ? { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' } : undefined}>
              <p className="text-lg font-bold" style={{ color: community.heroImage ? '#fff' : 'var(--text)' }}>{community.count}</p>
              <p className="text-xs mt-1" style={{ color: community.heroImage ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)' }}>Verified Listings</p>
            </div>
            <div className="stat-card" style={community.heroImage ? { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' } : undefined}>
              <p className="text-lg font-bold" style={{ color: community.heroImage ? '#fff' : 'var(--text)' }}>{community.avgPrice > 0 ? formatPrice(Math.round(community.avgPrice)) : '—'}</p>
              <p className="text-xs mt-1" style={{ color: community.heroImage ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)' }}>Average Price</p>
            </div>
          </div>
        </div>
      </section>

      {(community.overview || community.highlights?.length || community.amenities?.length) && (
        <section className="pb-4">
          <div className="wrap grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_1fr] gap-8">
            {community.overview && (
              <div>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Sparkles size={16} style={{ color: 'var(--teal)' }} /> About {community.name}
                </h2>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-mid)' }}>{community.overview}</p>
                {community.highlights?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-5">
                    {community.highlights.map((h, i) => <span key={i} className="badge badge-teal text-xs">{h.label}</span>)}
                  </div>
                )}
              </div>
            )}
            {community.amenities?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>Amenities & Nearby</h3>
                <div className="space-y-3">
                  {community.amenities.map((a, i) => {
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

      <section className="section pb-20">
        <div className="wrap">
          <h2 id="listings" className="text-lg font-bold mb-6 scroll-mt-24" style={{ color: 'var(--text)' }}>
            Available Listings in {community.name}{listingPage.total > 0 && <span className="font-normal text-sm ml-2" style={{ color: 'var(--text-muted)' }}>· {listingPage.total}</span>}
          </h2>
          {listings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map(p => <PropertyCard key={p._id} property={p} />)}
              </div>
              <LinkPagination page={page} totalPages={listingPage.totalPages} basePath={`/communities/${community.slug}`} anchor="listings"
                total={listingPage.total} perPage={PER_PAGE} itemLabel={listingPage.total === 1 ? 'listing' : 'listings'} />
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No live listings tagged to {community.name} right now — check back soon.</p>
            </div>
          )}

          {projects.length > 0 && (
            <>
              <h2 id="projects" className="text-lg font-bold mb-6 mt-14 scroll-mt-24" style={{ color: 'var(--text)' }}>
                New Projects in {community.name}<span className="font-normal text-sm ml-2" style={{ color: 'var(--text-muted)' }}>· {projectPage.total}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((p, i) => <ProjectCard key={p._id} project={p} markAsProject delay={Math.min(i, 8) * 0.05} />)}
              </div>
              <LinkPagination page={pPage} param="pp" totalPages={projectPage.totalPages} basePath={`/communities/${community.slug}`} anchor="projects"
                total={projectPage.total} perPage={PER_PAGE} itemLabel={projectPage.total === 1 ? 'project' : 'projects'} />
            </>
          )}
        </div>
      </section>

      <FaqSection title={`${community.name}: frequently asked questions`} faqs={faqs} />

      <Footer />
    </div>
  )
}
