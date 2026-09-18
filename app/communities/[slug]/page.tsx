import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Layers, MapPin, Sparkles } from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import PropertyCard from '@/components/buyer/PropertyCard'
import { propertyAPI, communityContentAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { HOME_ICON_MAP } from '@/lib/homeIcons'
import type { CommunityContentWithStats, Property } from '@/types'

const SITE_URL = 'https://distressdeals.ae'

const getCommunity = cache(async (slug: string): Promise<CommunityContentWithStats | null> => {
  try {
    const res = await communityContentAPI.getBySlug(slug)
    return res.data.success ? res.data.data : null
  } catch {
    return null
  }
})

const getCommunityListings = cache(async (name: string): Promise<Property[]> => {
  try {
    const res = await propertyAPI.getAll({ community: name, limit: 24 })
    return res.data.success ? res.data.data.data || [] : []
  } catch {
    return []
  }
})

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const community = await getCommunity(params.slug)
  if (!community) return { title: 'Community Not Found' }

  const title = `${community.name} — Properties & Community Guide`
  const description = community.overview?.slice(0, 155) || `${community.count} verified listing${community.count === 1 ? '' : 's'} in ${community.name}.`

  return {
    title,
    description,
    alternates: { canonical: `/communities/${community.slug}` },
    openGraph: { title, description, type: 'website', url: `/communities/${community.slug}`, ...(community.heroImage ? { images: [community.heroImage] } : {}) },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function CommunityDetailPage({ params }: { params: { slug: string } }) {
  const community = await getCommunity(params.slug)
  if (!community) notFound()

  const listings = await getCommunityListings(community.name)

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

      <Navbar />

      <section className="relative pt-20 pb-12 overflow-hidden">
        {community.heroImage ? (
          <>
            <img src={community.heroImage} alt={community.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,8,8,0.55) 0%, var(--bg) 92%)' }} />
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
          <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text)' }}>
            Available Listings in {community.name}
          </h2>
          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(p => <PropertyCard key={p._id} property={p} />)}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No live listings tagged to {community.name} right now — check back soon.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
