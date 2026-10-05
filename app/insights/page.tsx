import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Radio, Newspaper, MapPin, Layers, Building2, Compass, Clock, Landmark } from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import PlaceCard from '@/components/explore/PlaceCard'
import RealEstateLinks from '@/components/shared/RealEstateLinks'
import { blogAPI, newsAPI, areaContentAPI, communityContentAPI, buildingContentAPI, placeAPI, developerAPI, propertyAPI } from '@/lib/api'
import { resolveSeo } from '@/lib/seo'
import { formatDate, formatPrice } from '@/lib/utils'
import { EXPLORE_SECTIONS, sectionHref } from '@/lib/explore'
import type { BlogPost, NewsItem, AreaContentWithStats, CommunityContentWithStats, BuildingContent, PlaceSectionSummary, Developer } from '@/types'

// The Insights hub: news, blog, area / community / building guides and UAE Explore in one server-rendered page, so
// every section (and every link in it) is in the HTML search engines read. Rebuilt at most every 5 minutes.
export const revalidate = 300

const SITE_URL = 'https://www.distressdealsuae.com'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('insights', {
    title: 'UAE Real Estate Insights — Property Guides, Area Guides & Developers',
    description: 'UAE real estate insights in one place: property buying and selling guides, market news, area guides with property prices, community and building guides, developer guides and off-plan projects — plus where to go, eat and shop near your next home.',
    path: '/insights',
  })
}

const rows = (r: any) => r?.data?.data?.data || r?.data?.data || []

function SectionHead({ id, icon: Icon, title, subtitle, href, cta }: { id: string; icon: any; title: string; subtitle: string; href: string; cta: string }) {
  return (
    <div className="flex items-end justify-between gap-3 flex-wrap mb-5">
      <div>
        <h2 id={id} className="text-xl font-bold flex items-center gap-2 scroll-mt-28" style={{ color: 'var(--text)' }}>
          <Icon size={19} style={{ color: 'var(--teal)' }} /> {title}
        </h2>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
      </div>
      <Link href={href} className="text-xs font-semibold flex items-center gap-1 flex-shrink-0" style={{ color: 'var(--teal)' }}>
        {cta} <ArrowRight size={12} />
      </Link>
    </div>
  )
}

// Photo tile with the name over it — areas, communities, buildings.
function GuideTile({ href, image, title, sub, meta }: { href: string; image?: string; title: string; sub?: string; meta?: string }) {
  return (
    <Link href={href} className="group relative block h-40 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E293B, #7F1D1D)' }}>
      {image && <img src={image} alt={title} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
      <span className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,8,8,0.05) 30%, rgba(8,8,8,0.78) 100%)' }} />
      <span className="absolute left-3.5 right-3.5 bottom-3">
        <span className="block text-sm font-bold leading-snug text-white line-clamp-2">{title}</span>
        {(sub || meta) && <span className="block text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.82)' }}>{[sub, meta].filter(Boolean).join(' · ')}</span>}
      </span>
    </Link>
  )
}

function ArticleCard({ href, image, eyebrow, title, text, meta }: { href: string; image?: string; eyebrow: string; title: string; text?: string; meta?: string }) {
  return (
    <Link href={href} className="card-hover group flex flex-col overflow-hidden h-full">
      <div className="h-40 relative overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--bg-alt), rgba(203,1,1,0.08))' }}>
        {image && <img src={image} alt={title} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--teal)' }}>{eyebrow}</p>
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>{title}</h3>
        {text && <p className="text-xs mt-2 leading-relaxed line-clamp-2" style={{ color: 'var(--text-mid)' }}>{text}</p>}
        {meta && <p className="text-[11px] mt-auto pt-3 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Clock size={11} /> {meta}</p>}
      </div>
    </Link>
  )
}

export default async function InsightsPage() {
  const [newsRes, blogRes, areaRes, communityRes, buildingRes, exploreRes, developerRes, areaStatsRes] = await Promise.all([
    newsAPI.getAll({ status: 'published', limit: 7 }).catch(() => null),
    blogAPI.getAll({ status: 'published', limit: 6 }).catch(() => null),
    areaContentAPI.getAll().catch(() => null),
    communityContentAPI.getAll().catch(() => null),
    buildingContentAPI.getAll().catch(() => null),
    placeAPI.getSummary(4).catch(() => null),
    developerAPI.getAll().catch(() => null),
    propertyAPI.getAllAreas().catch(() => null),
  ])
  const news: NewsItem[] = rows(newsRes)
  const posts: BlogPost[] = rows(blogRes)
  const areas: AreaContentWithStats[] = rows(areaRes)
  const communities: CommunityContentWithStats[] = rows(communityRes)
  const buildings: BuildingContent[] = rows(buildingRes)
  const explore: PlaceSectionSummary[] = exploreRes?.data?.data || []
  // Developers with the most projects first.
  const developers: (Developer & { projectCount?: number; minPriceFrom?: number })[] = [...(rows(developerRes) as any[])].sort((a, b) => (b.projectCount || 0) - (a.projectCount || 0))
  const placeTotal = explore.reduce((a, s) => a + s.count, 0)
  // Photos first, so the grids look full.
  const withPhoto = <T extends { heroImage?: string }>(list: T[]) => [...list].sort((a, b) => Number(!!b.heroImage) - Number(!!a.heroImage))
  // Areas and communities: the ones with the most listings (properties + new projects) first, then the ones with a
  // photo. Area counts come from the listings themselves (GET /properties/areas), matched by page address.
  const areaListed = new Map<string, number>((rows(areaStatsRes) as any[]).map(a => [a.slug, (a.count || 0) + (a.projectCount || 0)]))
  const listedIn = (x: any) => areaListed.get(x.slug) ?? (x.count || 0)
  const busiest = <T extends { heroImage?: string }>(list: T[], n: (x: T) => number) => [...list].sort((a, b) => n(b) - n(a) || Number(!!b.heroImage) - Number(!!a.heroImage))
  const areasByListings = busiest(areas, listedIn)
  const communitiesByListings = busiest(communities, c => c.count || 0)

  const nav = [
    news.length && { href: '#news', label: 'News' },
    posts.length && { href: '#blog', label: 'Property Guides' },
    areas.length && { href: '#areas', label: 'Area Guides' },
    communities.length && { href: '#communities', label: 'Communities' },
    buildings.length && { href: '#buildings', label: 'Building Guides' },
    developers.length && { href: '#developers', label: 'Developer Guides' },
    { href: '#property', label: 'Find a Property' },
    placeTotal && { href: '#explore', label: 'UAE Explore' },
    ...EXPLORE_SECTIONS.filter(s => explore.find(x => x.category === s.key)?.count).map(s => ({ href: `#${s.path}`, label: s.label })),
  ].filter(Boolean) as { href: string; label: string }[]

  const stats = [
    { n: news.length ? `${news.length}+` : '', l: 'News stories' },
    { n: areas.length, l: 'Area guides' },
    { n: communities.length, l: 'Communities' },
    { n: buildings.length, l: 'Building guides' },
    { n: developers.length, l: 'Developer guides' },
    { n: placeTotal, l: 'Places to explore' },
  ].filter(s => s.n)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'UAE Insights',
    url: `${SITE_URL}/insights`,
    description: 'UAE real estate insights: property guides, market news, area, community, building and developer guides, off-plan projects and places to explore.',
    isPartOf: { '@type': 'WebSite', name: 'Distress Deals UAE', url: SITE_URL },
    hasPart: [
      { '@type': 'CollectionPage', name: 'News', url: `${SITE_URL}/news` },
      { '@type': 'Blog', name: 'Blog', url: `${SITE_URL}/blog` },
      { '@type': 'CollectionPage', name: 'Area Guides', url: `${SITE_URL}/areas` },
      { '@type': 'CollectionPage', name: 'Communities', url: `${SITE_URL}/communities` },
      { '@type': 'CollectionPage', name: 'Building Guides', url: `${SITE_URL}/buildings` },
      { '@type': 'CollectionPage', name: 'Developer Guides', url: `${SITE_URL}/developers` },
      { '@type': 'CollectionPage', name: 'Off-Plan Projects', url: `${SITE_URL}/projects` },
      { '@type': 'CollectionPage', name: 'Properties for Sale', url: `${SITE_URL}/for-sale` },
      { '@type': 'CollectionPage', name: 'UAE Explore', url: `${SITE_URL}/explore` },
      ...EXPLORE_SECTIONS.map(s => ({ '@type': 'CollectionPage', name: s.label, url: `${SITE_URL}/explore/${s.path}` })),
    ],
  }

  const [lead, ...moreNews] = news

  return (
    <div className="page overflow-x-hidden">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      <section className="relative pt-20 pb-8 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, var(--bg) 0%, var(--bg-alt) 60%, rgba(203,1,1,0.07) 100%)' }} />
        <div className="wrap relative z-10">
          <span className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
            style={{ background: 'rgba(203,1,1,0.08)', border: '1px solid rgba(203,1,1,0.25)', color: 'var(--teal)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--teal)' }} /> Insights
          </span>
          <h1 className="heading-xl mb-4 max-w-3xl">
            UAE real estate <span className="grad-text">insights</span>, guides and market knowledge
          </h1>
          <p className="text-base md:text-lg max-w-2xl leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Property buying and selling guides, real estate news, area guides with property prices, community, building and developer guides — and what is around your next home across Dubai, Abu Dhabi, Sharjah and the Northern Emirates.
          </p>
          {stats.length > 0 && (
            <dl className="flex flex-wrap gap-x-8 gap-y-3 mt-7">
              {stats.map(s => (
                <div key={s.l}>
                  <dd className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{typeof s.n === 'number' ? s.n.toLocaleString('en-US') : s.n}</dd>
                  <dt className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{s.l}</dt>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {/* Jump links — stay in view while scrolling */}
      <nav aria-label="Insights sections" className="sticky top-16 z-30 border-y" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
        <div className="wrap flex gap-2 overflow-x-auto scrollbar-hide py-2.5">
          {nav.map(n => (
            <a key={n.href} href={n.href} className="flex-shrink-0 px-3.5 h-8 inline-flex items-center rounded-full text-xs font-semibold whitespace-nowrap"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}>{n.label}</a>
          ))}
        </div>
      </nav>

      <div className="wrap pt-10 pb-6 space-y-16">
        {lead && (
          <section aria-labelledby="news">
            <SectionHead id="news" icon={Radio} title="Real Estate News" subtitle="Property market announcements, regulation and project launches" href="/news" cta="All news" />
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-5">
              <Link href={`/news/${lead.slug}`} className="group relative block min-h-[300px] rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E293B, #7F1D1D)' }}>
                {lead.coverImage && <img src={lead.coverImage} alt={lead.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                <span className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,8,8,0.05) 25%, rgba(8,8,8,0.85) 100%)' }} />
                <span className="absolute left-5 right-5 bottom-5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">{lead.category}</span>
                  <span className="block text-xl md:text-2xl font-bold leading-snug text-white mt-1.5">{lead.title}</span>
                  {lead.summary && <span className="block text-sm mt-2 line-clamp-2 text-white/85">{lead.summary}</span>}
                  {lead.publishedAt && <span className="block text-[11px] mt-2 text-white/70">{formatDate(lead.publishedAt)}</span>}
                </span>
              </Link>
              <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
                {moreNews.slice(0, 5).map(n => (
                  <li key={n._id} style={{ borderColor: 'var(--border)' }}>
                    <Link href={`/news/${n.slug}`} className="group flex gap-3 py-3">
                      <span className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-alt)' }}>
                        {n.coverImage && <img src={n.coverImage} alt="" loading="lazy" className="w-full h-full object-cover" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--teal)' }}>{n.category}</span>
                        <span className="block text-sm font-semibold leading-snug line-clamp-2 group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>{n.title}</span>
                        {n.publishedAt && <span className="block text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDate(n.publishedAt)}</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {posts.length > 0 && (
          <section aria-labelledby="blog">
            <SectionHead id="blog" icon={Newspaper} title="Property Guides & Blog" subtitle="How to buy, sell, rent and invest in UAE property — step by step" href="/blog" cta="All guides" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.slice(0, 6).map(p => (
                <ArticleCard key={p._id} href={`/blog/${p.slug}`} image={p.coverImage} eyebrow={p.category} title={p.title} text={p.excerpt} meta={`${p.readTime} min read`} />
              ))}
            </div>
          </section>
        )}

        {areas.length > 0 && (
          <section aria-labelledby="areas">
            <SectionHead id="areas" icon={MapPin} title="Area Guides" subtitle="Where to buy and rent — property types, lifestyle and prices by area" href="/areas" cta={`All ${areas.length} areas`} />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {areasByListings.slice(0, 8).map(a => (
                <GuideTile key={a._id} href={`/areas/${a.slug}`} image={a.heroImage} title={a.area}
                  sub={a.count ? `${a.count} listing${a.count === 1 ? '' : 's'}` : undefined} meta={a.avgPrice > 0 ? `avg ${formatPrice(Math.round(a.avgPrice))}` : undefined} />
              ))}
            </div>
          </section>
        )}

        {communities.length > 0 && (
          <section aria-labelledby="communities">
            <SectionHead id="communities" icon={Layers} title="Community Guides" subtitle="Residential communities and master developments, with properties for sale and rent" href="/communities" cta={`All ${communities.length} communities`} />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {communitiesByListings.slice(0, 12).map(c => (
                <GuideTile key={c._id} href={`/communities/${c.slug}`} image={c.heroImage} title={c.name} sub={c.area && c.area !== c.name ? c.area : c.emirate} meta={c.count ? `${c.count} listings` : undefined} />
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {communitiesByListings.slice(12, 40).map(c => (
                <Link key={c._id} href={`/communities/${c.slug}`} className="px-3 py-1.5 rounded-full text-[11px] font-medium"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}>{c.name}</Link>
              ))}
            </div>
          </section>
        )}

        {buildings.length > 0 && (
          <section aria-labelledby="buildings">
            <SectionHead id="buildings" icon={Building2} title="Building Guides" subtitle="Residential towers and landmark buildings — floors, location and what is nearby" href="/buildings" cta={`All ${buildings.length} buildings`} />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {withPhoto(buildings).slice(0, 8).map(b => (
                <GuideTile key={b._id} href={`/buildings/${b.slug}`} image={b.heroImage} title={b.name} sub={b.area}
                  meta={[b.totalFloors && `${b.totalFloors} floors`, b.yearBuilt].filter(Boolean).join(' · ') || undefined} />
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {withPhoto(buildings).slice(8, 36).map(b => (
                <Link key={b._id} href={`/buildings/${b.slug}`} className="px-3 py-1.5 rounded-full text-[11px] font-medium"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}>{b.name}</Link>
              ))}
            </div>
          </section>
        )}

        {developers.length > 0 && (
          <section aria-labelledby="developers">
            <SectionHead id="developers" icon={Landmark} title="Developer Guides" subtitle="UAE property developers — their off-plan projects, starting prices and where they build" href="/developers" cta={`All ${developers.length} developers`} />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {developers.slice(0, 12).map(d => (
                <Link key={d._id} href={`/developers/${d.slug}`} className="card-hover light-card group p-4 flex flex-col items-center text-center gap-2">
                  {/* Every logo sits in the same 88×32 box (as on the homepage), whatever its own shape. */}
                  <span className="w-[88px] h-8 flex items-center justify-center">
                    {d.logo
                      ? <img src={d.logo} alt={`${d.name} — property developer`} loading="lazy" decoding="async" className="w-full h-full object-contain" />
                      : <Landmark size={24} style={{ color: 'var(--teal)', opacity: 0.4 }} />}
                  </span>
                  <span className="text-xs font-semibold leading-snug group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>{d.name}</span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {d.projectCount ? `${d.projectCount} project${d.projectCount === 1 ? '' : 's'}` : 'Developer guide'}
                    {d.minPriceFrom ? ` · from ${formatPrice(d.minPriceFrom)}` : ''}
                  </span>
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {developers.slice(12).map(d => (
                <Link key={d._id} href={`/developers/${d.slug}`} className="px-3 py-1.5 rounded-full text-[11px] font-medium"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}>{d.name} projects</Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Property search — buy, rent, off-plan, distress deals, valuation, mortgage */}
      <div id="property" className="scroll-mt-28 pt-10">
        <RealEstateLinks />
      </div>

      <div className="wrap pb-20 space-y-16">
        {placeTotal > 0 && (
          <section aria-labelledby="explore" className="rounded-3xl p-5 md:p-8" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
            <SectionHead id="explore" icon={Compass} title="UAE Explore" subtitle={`What is around your next home — ${placeTotal.toLocaleString('en-US')} places to go, eat, shop and stay, with exact locations and reviews`} href="/explore" cta="Open UAE Explore" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {EXPLORE_SECTIONS.map(s => {
                const count = explore.find(x => x.category === s.key)?.count || 0
                if (!count) return null
                return (
                  <Link key={s.key} href={`/explore/${s.path}`} className="card-hover p-4 flex flex-col gap-2">
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(203,1,1,0.08)' }}><s.icon size={19} style={{ color: 'var(--teal)' }} /></span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{s.label}</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{count} places</span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {EXPLORE_SECTIONS.map(s => {
          const data = explore.find(x => x.category === s.key)
          if (!data?.top.length) return null
          return (
            <section key={s.key} aria-labelledby={s.path}>
              <SectionHead id={s.path} icon={s.icon} title={s.label} subtitle={s.blurb} href={`/explore/${s.path}`} cta={`All ${data.count}`} />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {data.top.slice(0, 4).map(p => <PlaceCard key={p._id} place={p} compact />)}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {data.emirates.slice(0, 7).map(e => (
                  <Link key={e.emirate} href={sectionHref(s, e.emirate)} className="px-3 py-1.5 rounded-full text-[11px] font-medium"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}>{e.emirate} · {e.count}</Link>
                ))}
              </div>
            </section>
          )
        })}

        <section className="card p-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <Building2 size={20} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--teal)' }} />
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Buying, selling or renting property in the UAE?</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Verified apartments, villas and townhouses, off-plan projects and distress deals — direct from owners and developers.</p>
            </div>
          </div>
          <div className="flex gap-2.5 flex-wrap">
            <Link href="/for-sale" className="btn-primary h-10 px-5 text-sm">Properties for sale</Link>
            <Link href="/projects" className="btn-outline h-10 px-5 text-sm">Off-plan projects</Link>
            <Link href="/sell" className="btn-outline h-10 px-5 text-sm">Sell your property</Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}
