import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Building2, MapPin, CalendarClock, Layers, Sparkles } from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import { buildingContentAPI } from '@/lib/api'
import { HOME_ICON_MAP } from '@/lib/homeIcons'
import type { BuildingContent } from '@/types'

const SITE_URL = 'https://distressdeals.ae'

const getBuilding = cache(async (slug: string): Promise<BuildingContent | null> => {
  try {
    const res = await buildingContentAPI.getBySlug(slug)
    return res.data.success ? res.data.data : null
  } catch {
    return null
  }
})

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const building = await getBuilding(params.slug)
  if (!building) return { title: 'Building Not Found' }

  const title = `${building.name} — Building Guide`
  const description = building.overview?.slice(0, 155) || `${building.name}${building.area ? ` in ${building.area}` : ''} — building guide.`

  return {
    title,
    description,
    alternates: { canonical: `/buildings/${building.slug}` },
    openGraph: { title, description, type: 'website', url: `/buildings/${building.slug}`, ...(building.heroImage ? { images: [building.heroImage] } : {}) },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function BuildingDetailPage({ params }: { params: { slug: string } }) {
  const building = await getBuilding(params.slug)
  if (!building) notFound()

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Buildings', item: `${SITE_URL}/buildings` },
      { '@type': 'ListItem', position: 3, name: building.name, item: `${SITE_URL}/buildings/${building.slug}` },
    ],
  }

  return (
    <div className="page overflow-x-hidden">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <Navbar />

      <section className="relative pt-20 pb-12 overflow-hidden">
        {building.heroImage ? (
          <>
            <img src={building.heroImage} alt={building.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,8,8,0.55) 0%, var(--bg) 92%)' }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, var(--bg) 0%, var(--bg-alt) 60%, #EFF6FF 100%)' }} />
        )}

        <div className="wrap relative z-10">
          <p className="text-xs mb-4" style={{ color: building.heroImage ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)' }}>
            <Link href="/buildings" className="hover:underline">Buildings</Link> / {building.name}
          </p>
          <h1 className="heading-xl mb-3 flex items-center gap-3" style={building.heroImage ? { color: '#fff' } : undefined}>
            <Building2 size={28} style={{ color: 'var(--teal)' }} />
            {building.name}
          </h1>
          <div className="flex items-center gap-4 text-sm mb-8 flex-wrap" style={{ color: building.heroImage ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)' }}>
            {building.area && <span className="flex items-center gap-1.5"><MapPin size={13} style={{ color: 'var(--teal)' }} />{building.area}{building.community && ` · ${building.community}`}</span>}
            {building.developer && <span>{building.developer}</span>}
            {building.yearBuilt && <span className="flex items-center gap-1.5"><CalendarClock size={13} style={{ color: 'var(--teal)' }} />Built {building.yearBuilt}</span>}
            {building.totalFloors && <span className="flex items-center gap-1.5"><Layers size={13} style={{ color: 'var(--teal)' }} />{building.totalFloors} floors</span>}
          </div>
        </div>
      </section>

      {(building.overview || building.amenities?.length > 0) && (
        <section className="pb-16">
          <div className="wrap grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_1fr] gap-8">
            {building.overview && (
              <div>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Sparkles size={16} style={{ color: 'var(--teal)' }} /> About {building.name}
                </h2>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-mid)' }}>{building.overview}</p>
              </div>
            )}
            {building.amenities?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>Amenities</h3>
                <div className="space-y-3">
                  {building.amenities.map((a, i) => {
                    const Icon = HOME_ICON_MAP[a.icon]
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(49,178,222,0.08)' }}>
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

      <Footer />
    </div>
  )
}
