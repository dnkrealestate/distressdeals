import Link from 'next/link'
import { Search } from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import PlaceCard from '@/components/explore/PlaceCard'
import FaqSection, { type Faq } from '@/components/shared/FaqSection'
import RealEstateLinks from '@/components/shared/RealEstateLinks'
import { placeAPI } from '@/lib/api'
import { shareImages, fitTitle, fitDescription } from '@/lib/seo'
import { EXPLORE_SECTIONS, EMIRATES, sectionHref, placeHref, type ExploreSection } from '@/lib/explore'
import type { Metadata } from 'next'
import type { Place } from '@/types'

// One Explore section as a list — the whole UAE (/explore/malls) or one emirate (/explore/malls/dubai). Both are real
// landing pages with their own title, intro, structured data and FAQs; search / sort only re-order the same page.
const SITE_URL = 'https://www.distressdealsuae.com'
const PER_PAGE = 24
export type ListParams = { q?: string; sort?: string; page?: string }
const SORTS = [{ v: '', l: 'Most popular' }, { v: 'rating', l: 'Highest rated' }, { v: 'name', l: 'A – Z' }]

const query = (sp: ListParams, change: Partial<ListParams>) => {
  const next: ListParams = { ...sp, page: undefined, ...change }
  const qs = (['q', 'sort', 'page'] as const).filter(k => next[k] && !(k === 'page' && next[k] === '1')).map(k => `${k}=${encodeURIComponent(next[k]!)}`).join('&')
  return qs ? `?${qs}` : ''
}

export function sectionListMetadata(section: ExploreSection, emirate: string | undefined, sp: ListParams = {}): Metadata {
  const page = Math.max(1, Number(sp.page) || 1)
  const base = emirate ? `${section.label} in ${emirate}` : section.seoTitle
  const title = `${emirate ? `${base} — Locations, Tips & Reviews` : base}${page > 1 ? ` (Page ${page})` : ''}`
  const description = emirate
    ? `${section.label} in ${emirate}, UAE: ${section.blurb} Exact map locations, opening details, practical tips and visitor reviews.`
    : section.seoDescription
  const canonical = `${sectionHref(section, emirate)}${page > 1 ? `?page=${page}` : ''}`
  return {
    title: fitTitle(title), description: fitDescription(description),
    keywords: [emirate ? `${section.label.toLowerCase()} in ${emirate}` : `${section.label.toLowerCase()} in UAE`, `best ${section.label.toLowerCase()} ${emirate || 'UAE'}`, `${emirate || 'UAE'} ${section.singular} guide`, `${section.label.toLowerCase()} near me ${emirate || 'UAE'}`, `properties for sale in ${emirate || 'UAE'}`, `apartments for rent in ${emirate || 'UAE'}`, `off-plan projects in ${emirate || 'UAE'}`, `${emirate || 'UAE'} real estate`],
    alternates: { canonical },
    // Search results and re-sorted lists are the same content — keep only the plain list in the index.
    robots: sp.q || sp.sort ? { index: false, follow: true } : { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    openGraph: { title, description, type: 'website', url: canonical, images: shareImages() },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function SectionList({ section, emirate, searchParams = {} }: { section: ExploreSection; emirate?: string; searchParams?: ListParams }) {
  const page = Math.max(1, Number(searchParams.page) || 1)
  const q = (searchParams.q || '').trim().slice(0, 60)
  const base = sectionHref(section, emirate)

  const [res, summary] = await Promise.all([
    placeAPI.getAll({ category: section.key, emirate, q: q || undefined, sort: searchParams.sort || undefined, page, limit: PER_PAGE }).then(r => r.data.data).catch(() => null),
    placeAPI.getSummary(1).then(r => (r.data.data || []).find((s: any) => s.category === section.key)).catch(() => null),
  ])
  const places: Place[] = res?.data || []
  const total: number = res?.total || 0
  const totalPages: number = res?.totalPages || 1
  const perEmirate: { emirate: string; count: number }[] = summary?.emirates || []

  const where = emirate || 'the UAE'
  const heading = `${section.label} in ${where}`
  // Districts with the most places on this page — real data, used in the intro and the FAQs.
  const areaCount = new Map<string, number>()
  for (const p of places) if (p.area) areaCount.set(p.area, (areaCount.get(p.area) || 0) + 1)
  const topAreas = [...areaCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(a => a[0])
  const list = (a: string[]) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`)
  const label = section.label.toLowerCase()

  const faqs: Faq[] = page === 1 && !q ? [
    { q: `How many ${label} are listed in ${where}?`, a: `This guide lists ${total} ${total === 1 ? section.singular : label} in ${where}, each with its exact map position${perEmirate.length > 1 && !emirate ? ` — ${list(perEmirate.slice(0, 4).map(e => `${e.count} in ${e.emirate}`))}` : ''}.` },
    places.length >= 3 ? { q: `Which are the best-known ${label} in ${where}?`, a: `Among the best known are ${list(places.slice(0, 5).map(p => p.name))}.` } : { q: '', a: '' },
    topAreas.length >= 2 ? { q: `Which areas of ${where} have the most ${label}?`, a: `On this page the most are in ${list(topAreas)}.` } : { q: '', a: '' },
    { q: `Can I leave a review?`, a: `Yes. Open any place and use “Write a review”. Reviews need a free account and appear after they have been checked.` },
  ] : []

  const jsonLd = [
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'UAE Explore', item: `${SITE_URL}/explore` },
        { '@type': 'ListItem', position: 3, name: section.label, item: `${SITE_URL}${sectionHref(section)}` },
        ...(emirate ? [{ '@type': 'ListItem', position: 4, name: emirate, item: `${SITE_URL}${base}` }] : []),
      ],
    },
    {
      '@context': 'https://schema.org', '@type': 'CollectionPage', name: heading, url: `${SITE_URL}${base}`,
      description: section.seoDescription,
      mainEntity: {
        '@type': 'ItemList', name: heading, numberOfItems: total,
        itemListElement: places.map((p, i) => ({
          '@type': 'ListItem', position: (page - 1) * PER_PAGE + i + 1, url: `${SITE_URL}${placeHref(p)}`, name: p.name,
          ...(p.heroImage ? { image: p.heroImage } : {}),
        })),
      },
    },
  ]

  return (
    <div className="page overflow-x-hidden">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      <section className="relative pt-20 pb-8 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, var(--bg) 0%, var(--bg-alt) 60%, rgba(203,1,1,0.06) 100%)' }} />
        <div className="wrap relative z-10">
          <nav aria-label="Breadcrumb" className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            <Link href="/insights" className="hover:underline">Insights</Link> / <Link href="/explore" className="hover:underline">UAE Explore</Link> /{' '}
            {emirate ? <><Link href={sectionHref(section)} className="hover:underline">{section.label}</Link> / {emirate}</> : section.label}
          </nav>
          <h1 className="heading-xl mb-3 flex items-center gap-3">
            <section.icon size={28} className="flex-shrink-0" style={{ color: 'var(--teal)' }} /> {heading}
          </h1>
          <p className="text-sm max-w-3xl leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {section.blurb}{' '}
            {total > 0 && `This guide covers ${total.toLocaleString('en-US')} ${total === 1 ? section.singular : label} in ${where}${topAreas.length >= 2 ? `, including ${list(topAreas)}` : ''} — each with its exact location, practical details and reviews from visitors.`}
          </p>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-6 pb-1">
            {EXPLORE_SECTIONS.map(s => (
              <Link key={s.key} href={sectionHref(s, emirate)}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full text-xs font-semibold whitespace-nowrap"
                style={s.key === section.key ? { background: 'var(--grad)', color: '#fff' } : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}>
                <s.icon size={13} /> {s.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-14">
        <div className="wrap">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 flex-1 min-w-0">
              {['', ...EMIRATES].map(e => {
                const active = (emirate || '') === e
                const n = e ? perEmirate.find(x => x.emirate === e)?.count : undefined
                if (e && !n && !active) return null
                return (
                  <Link key={e || 'all'} href={sectionHref(section, e || undefined)}
                    className="flex-shrink-0 px-3 h-8 inline-flex items-center rounded-full text-[11px] font-semibold whitespace-nowrap"
                    style={active ? { background: 'var(--text)', color: 'var(--bg)' } : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}>
                    {e || 'All UAE'}{n ? ` · ${n}` : ''}
                  </Link>
                )
              })}
            </div>
            {/* Plain GET form — works without JavaScript */}
            <form action={base} className="flex items-center gap-2 w-full sm:w-auto">
              <label className="relative flex-1 sm:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input name="q" defaultValue={q} placeholder={`Search ${label}`} className="input h-9 pl-9 text-xs" aria-label="Search" />
              </label>
              <select name="sort" defaultValue={searchParams.sort || ''} className="input h-9 text-xs w-auto" aria-label="Sort">
                {SORTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
              <button className="btn-primary h-9 px-4 text-xs">Go</button>
            </form>
          </div>

          {places.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {places.map(p => <PlaceCard key={p._id} place={p} />)}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Nothing here yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{q ? `No ${label} match “${q}”.` : `We’re still adding ${label}${emirate ? ` in ${emirate}` : ''}.`}</p>
              <Link href={sectionHref(section)} className="btn-outline h-9 px-4 text-xs mt-4 inline-flex">See all {label}</Link>
            </div>
          )}

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 mt-10 flex-wrap" aria-label="Pages">
              {page > 1 && <Link href={`${base}${query(searchParams, { page: String(page - 1) })}`} className="btn-outline h-9 px-4 text-xs" rel="prev">Previous</Link>}
              <span className="text-xs px-2" style={{ color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
              {page < totalPages && <Link href={`${base}${query(searchParams, { page: String(page + 1) })}`} className="btn-outline h-9 px-4 text-xs" rel="next">Next</Link>}
            </nav>
          )}

          {/* Other sections in the same emirate, and the same section in other emirates */}
          <div className="card p-5 mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>{section.label} by emirate</h2>
              <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                {perEmirate.map(e => (
                  <li key={e.emirate}><Link href={sectionHref(section, e.emirate)} className="text-xs hover:underline" style={{ color: 'var(--text-mid)' }}>{section.label} in {e.emirate} ({e.count})</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>More to explore in {where}</h2>
              <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                {EXPLORE_SECTIONS.filter(s => s.key !== section.key).map(s => (
                  <li key={s.key}><Link href={sectionHref(s, emirate)} className="text-xs hover:underline" style={{ color: 'var(--text-mid)' }}>{s.label} in {where}</Link></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <RealEstateLinks emirate={emirate} />

      <FaqSection title={`${heading}: questions and answers`} faqs={faqs} />

      <Footer />
    </div>
  )
}
