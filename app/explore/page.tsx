import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Compass } from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import PlaceCard from '@/components/explore/PlaceCard'
import RealEstateLinks from '@/components/shared/RealEstateLinks'
import { placeAPI } from '@/lib/api'
import { resolveSeo } from '@/lib/seo'
import { EXPLORE_SECTIONS, EMIRATES, sectionHref } from '@/lib/explore'
import type { PlaceSectionSummary } from '@/types'

// Managed in the admin — rebuilt from the latest data at most every 5 minutes.
export const revalidate = 300

const SITE_URL = 'https://www.distressdealsuae.com'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('explore', {
    title: 'Explore the UAE — Tourist Places, Food, Malls, Markets, Hotels & Activities',
    description: 'A local guide to the UAE for residents, home buyers and investors: tourist places, restaurants, shopping malls, souks, hotels and things to do near properties for sale and rent in Dubai, Abu Dhabi, Sharjah and every emirate.',
    path: '/explore',
  })
}

export default async function ExplorePage() {
  const summary: PlaceSectionSummary[] = await placeAPI.getSummary(8).then(r => r.data.data || []).catch(() => [])
  const total = summary.reduce((a, s) => a + s.count, 0)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Explore the UAE',
    url: `${SITE_URL}/explore`,
    description: 'Tourist places, food, shopping malls, markets, hotels and activities across the UAE.',
    hasPart: EXPLORE_SECTIONS.map(s => ({ '@type': 'CollectionPage', name: s.label, url: `${SITE_URL}/explore/${s.path}` })),
  }

  return (
    <div className="page overflow-x-hidden">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      <section className="relative pt-20 pb-10 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, var(--bg) 0%, var(--bg-alt) 60%, rgba(203,1,1,0.06) 100%)' }} />
        <div className="wrap relative z-10">
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            <Link href="/insights" className="hover:underline">Insights</Link> / UAE Explore
          </p>
          <h1 className="heading-xl mb-4 max-w-3xl flex items-center gap-3">
            <Compass size={30} className="flex-shrink-0" style={{ color: 'var(--teal)' }} />
            <span>Explore the <span className="grad-text">UAE</span></span>
          </h1>
          <p className="text-base max-w-2xl leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Where to go, eat, shop and stay near your home across the seven emirates{total ? ` — ${total.toLocaleString('en-US')} places with exact locations and reviews from people who have been there` : ''}.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
            {EXPLORE_SECTIONS.map(s => {
              const count = summary.find(x => x.category === s.key)?.count || 0
              return (
                <Link key={s.key} href={`/explore/${s.path}`} className="card-hover p-4 flex flex-col gap-2">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(203,1,1,0.08)' }}>
                    <s.icon size={19} style={{ color: 'var(--teal)' }} />
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{s.label}</span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{count ? `${count} places` : 'Coming soon'}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <div className="wrap pb-20 space-y-14 pt-6">
        {EXPLORE_SECTIONS.map(s => {
          const data = summary.find(x => x.category === s.key)
          if (!data?.top.length) return null
          return (
            <section key={s.key} aria-labelledby={`h-${s.key}`}>
              <div className="flex items-end justify-between gap-3 flex-wrap mb-5">
                <div>
                  <h2 id={`h-${s.key}`} className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <s.icon size={19} style={{ color: 'var(--teal)' }} /> {s.label}
                  </h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.blurb}</p>
                </div>
                <Link href={`/explore/${s.path}`} className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--teal)' }}>
                  All {data.count} <ArrowRight size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {data.top.slice(0, 8).map(p => <PlaceCard key={p._id} place={p} compact />)}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {data.emirates.map(e => (
                  <Link key={e.emirate} href={sectionHref(s, e.emirate)} className="px-3 py-1.5 rounded-full text-[11px] font-semibold"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}>
                    {s.label} in {e.emirate} · {e.count}
                  </Link>
                ))}
              </div>
            </section>
          )
        })}

        {total === 0 && (
          <p className="text-sm text-center py-16" style={{ color: 'var(--text-muted)' }}>Places are being added — check back soon.</p>
        )}

        <section className="card p-6">
          <h2 className="text-base font-bold mb-3" style={{ color: 'var(--text)' }}>Explore by emirate</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
            {EMIRATES.map(e => (
              <div key={e}>
                <p className="text-sm font-semibold mt-2" style={{ color: 'var(--text)' }}>{e}</p>
                <ul className="mt-1 space-y-1">
                  {EXPLORE_SECTIONS.filter(s => summary.find(x => x.category === s.key)?.emirates.some(x => x.emirate === e)).map(s => (
                    <li key={s.key}>
                      <Link href={sectionHref(s, e)} className="text-xs hover:underline" style={{ color: 'var(--text-mid)' }}>{s.label} in {e}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>

      <RealEstateLinks />

      <Footer />
    </div>
  )
}
