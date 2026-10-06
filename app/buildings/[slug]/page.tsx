import { cache } from 'react'
import Image from 'next/image'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Building2, MapPin, CalendarClock, Layers, Sparkles } from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import ReviewsSection from '@/components/shared/ReviewsSection'
import Footer from '@/components/layouts/Footer'
import { buildingContentAPI, placeAPI } from '@/lib/api'
import PlaceCard from '@/components/explore/PlaceCard'
import PlaceMap from '@/components/explore/PlaceMap'
import FaqSection, { type Faq } from '@/components/shared/FaqSection'
import RealEstateLinks from '@/components/shared/RealEstateLinks'
import { placeHref } from '@/lib/explore'
import { formatPrice } from '@/lib/utils'
import { HOME_ICON_MAP } from '@/lib/homeIcons'
import type { BuildingContent, Place } from '@/types'
import { shareImages, fitTitle, fitDescription } from '@/lib/seo'

// Edited in the admin — serve the latest version (rebuilt at most every 60 s).
export const revalidate = 60

const SITE_URL = 'https://www.distressdealsuae.com'

const getBuilding = cache(async (slug: string): Promise<BuildingContent | null> => {
  try {
    const res = await buildingContentAPI.getBySlug(slug)
    return res.data.success ? res.data.data : null
  } catch {
    return null
  }
})

const whereOf = (b: BuildingContent) => [b.area && b.area !== b.emirate ? b.area : '', b.emirate].filter(Boolean).join(', ')

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const building = await getBuilding(params.slug)
  if (!building) return { title: 'Building Not Found' }

  const where = whereOf(building)
  const facts = [building.totalFloors ? `${building.totalFloors} floors` : '', building.yearBuilt ? `built ${building.yearBuilt}` : ''].filter(Boolean).join(', ')
  const title = building.metaTitle || ([`${building.name}: Floors, Location & Guide`, `${building.name}: Building Guide`].find(x => x.length <= 44) || building.name)
  const lead = (building.overview || `${building.name} is a building${where ? ` in ${where}` : ''}.`).replace(/\s+/g, ' ').split('. ')[0].replace(/\.$/, '')
  const description = building.metaDescription || `${lead.slice(0, 105)}${facts ? ` — ${facts}` : ''}. Exact location, nearby places, properties and reviews.`.slice(0, 160)
  const alt = `${building.name}${where ? `, ${where}` : ''}`

  return {
    title: fitTitle(title),
    description: fitDescription(description),
    keywords: building.seoKeywords?.length ? [building.focusKeyword || building.name, ...building.seoKeywords] : [building.name, `${building.name} location`, `${building.name} floors`, `${building.name} apartments`, building.area ? `buildings in ${building.area}` : '', building.area ? `apartments for sale in ${building.area}` : '', building.emirate ? `towers in ${building.emirate}` : '', building.developer ? `${building.developer} buildings` : ''].filter(Boolean),
    alternates: { canonical: `/buildings/${building.slug}` },
    robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    openGraph: { title, description, type: 'article', url: `/buildings/${building.slug}`, siteName: 'Distress Deals UAE', locale: 'en_AE', images: shareImages(building.heroImage, alt) },
    twitter: { card: 'summary_large_image', title, description, ...(building.heroImage ? { images: [{ url: building.heroImage, alt }] } : {}) },
    other: building.coordinates?.lat != null ? { 'geo.position': `${building.coordinates.lat};${building.coordinates.lng}`, ICBM: `${building.coordinates.lat}, ${building.coordinates.lng}`, 'geo.region': 'AE' } : {},
  }
}

export default async function BuildingDetailPage({ params }: { params: { slug: string } }) {
  const building = await getBuilding(params.slug)
  if (!building) notFound()

  const where = whereOf(building)
  const c = building.coordinates?.lat != null ? building.coordinates : null
  const near: { places: Place[]; projects: any[] } = c
    ? await placeAPI.getNear(c.lat, c.lng, 8).then(r => r.data.data).catch(() => ({ places: [], projects: [] }))
    : { places: [], projects: [] }
  const dist = (d?: number) => (d == null ? '' : d < 1 ? `${Math.round(d * 1000)} m` : `${d} km`)
  const mapsUrl = c ? `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}` : null
  const url = `${SITE_URL}/buildings/${building.slug}`

  // The building itself, with its position, size and photo credit.
  const buildingJsonLd = {
    '@context': 'https://schema.org',
    '@type': ['Place', 'LandmarksOrHistoricalBuildings'],
    '@id': `${url}#building`,
    name: building.name, url,
    ...(building.overview ? { description: building.overview.slice(0, 500) } : {}),
    ...(building.heroImage ? { image: { '@type': 'ImageObject', url: building.heroImage, caption: `${building.name}${where ? `, ${where}` : ''}`, ...(building.heroImageCredit?.name ? { creditText: building.heroImageCredit.name, license: building.heroImageCredit.url, acquireLicensePage: building.heroImageCredit.url } : {}) } } : {}),
    address: { '@type': 'PostalAddress', ...(building.area ? { addressLocality: building.area } : {}), ...(building.emirate ? { addressRegion: building.emirate } : {}), addressCountry: 'AE' },
    ...(c ? { geo: { '@type': 'GeoCoordinates', latitude: c.lat, longitude: c.lng }, hasMap: `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}` } : {}),
    additionalProperty: [
      building.totalFloors ? { '@type': 'PropertyValue', name: 'Floors', value: building.totalFloors } : null,
      building.yearBuilt ? { '@type': 'PropertyValue', name: 'Year built', value: building.yearBuilt } : null,
      building.developer ? { '@type': 'PropertyValue', name: 'Developer', value: building.developer } : null,
    ].filter(Boolean),
    ...(building.amenities?.length ? { amenityFeature: building.amenities.slice(0, 12).map(a => ({ '@type': 'LocationFeatureSpecification', name: a.label, value: true })) } : {}),
  }

  // Answers come only from the building's own record and what is mapped around it.
  const faqs: Faq[] = [
    where ? { q: `Where is ${building.name}?`, a: `${building.name} is in ${where}, United Arab Emirates.${c ? ` Map position: ${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}.` : ''}` } : { q: '', a: '' },
    building.totalFloors ? { q: `How many floors does ${building.name} have?`, a: `${building.name} has ${building.totalFloors} floors.` } : { q: '', a: '' },
    building.yearBuilt ? { q: `When was ${building.name} built?`, a: `${building.name} dates from ${building.yearBuilt}.` } : { q: '', a: '' },
    building.developer ? { q: `Who developed ${building.name}?`, a: `${building.name} was developed by ${building.developer}.` } : { q: '', a: '' },
    near.places.length ? { q: `What is near ${building.name}?`, a: `Nearby: ${near.places.slice(0, 4).map(p => `${p.name} (${dist(p.distanceKm)})`).join(', ')}.` } : { q: '', a: '' },
    near.projects.length ? { q: `Are there new projects near ${building.name}?`, a: `Yes — ${near.projects.slice(0, 3).map((p: any) => p.name).join(', ')} ${near.projects.length === 1 ? 'is' : 'are'} within a short drive.` } : { q: '', a: '' },
  ]

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumbJsonLd, buildingJsonLd]) }} />

      <Navbar />

      <section className="relative pt-20 pb-12 overflow-hidden">
        {building.heroImage ? (
          <>
            <Image src={building.heroImage} alt={`${building.name}${where ? ` — building in ${where}` : ''}`} title={building.name} fill priority sizes="100vw" quality={70} className="object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,8,8,0.55) 0%, var(--bg) 92%)' }} />
            {building.heroImageCredit?.name && (
              <a href={building.heroImageCredit.url} target="_blank" rel="noopener noreferrer nofollow"
                className="absolute top-20 right-4 z-10 text-[10px] px-2 py-0.5 rounded hover:underline" style={{ background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.8)' }}>
                Photo: {building.heroImageCredit.name}{building.heroImageCredit.license ? ` · ${building.heroImageCredit.license}` : ''} · Wikimedia Commons
              </a>
            )}
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

      {(c || near.places.length > 0) && (
        <section className="pb-14">
          <div className="wrap grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_1fr] gap-8">
            <div className="min-w-0">
              <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>Where is {building.name}?</h2>
              <p className="text-sm leading-7 mb-5" style={{ color: 'var(--text-mid)' }}>
                {building.name} is in {where || 'the UAE'}, United Arab Emirates.
                {near.places.length > 0 && <> The closest places in our guide are {near.places.slice(0, 3).map((p, i, a) => (
                  <span key={p._id}>{i > 0 ? (i === a.length - 1 ? ' and ' : ', ') : ''}<Link href={placeHref(p)} className="font-semibold hover:underline" style={{ color: 'var(--text)' }}>{p.name}</Link> ({dist(p.distanceKm)})</span>
                ))}.</>}
                {mapsUrl && <> <a href={mapsUrl} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold hover:underline" style={{ color: 'var(--teal)' }}>Get directions</a>.</>}
              </p>
              {near.places.length > 0 && (
                <>
                  <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>What’s near {building.name}</h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {near.places.slice(0, 8).map(p => <PlaceCard key={p._id} place={p} compact />)}
                  </div>
                </>
              )}
            </div>
            {c && (
              <div className="card overflow-hidden h-fit">
                <div className="h-64"><PlaceMap lat={c.lat} lng={c.lng} landmarks={near.places.filter(p => p.coordinates?.lat != null).map(p => ({ lat: p.coordinates!.lat, lng: p.coordinates!.lng, title: p.name }))} /></div>
                <div className="p-4">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Location</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{where}</p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{c.lat.toFixed(5)}, {c.lng.toFixed(5)}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {near.projects.length > 0 && (
        <section className="pb-14">
          <div className="wrap">
            <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--text)' }}>New projects near {building.name}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {near.projects.map((p: any) => {
                const img = p.coverImage || p.images?.[0]?.url
                return (
                  <Link key={p._id} href={`/projects/${p.slug}`} className="card-hover group overflow-hidden flex flex-col">
                    <div className="h-32 relative overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                      {img && <img src={img} alt={`${p.name} — new project near ${building.name}`} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />}
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--surface)', color: 'var(--text)' }}>{p.distanceKm} km</span>
                    </div>
                    <div className="p-3.5">
                      <p className="text-sm font-semibold line-clamp-1" style={{ color: 'var(--text)' }}>{p.name}</p>
                      <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{[p.area, p.developer].filter(Boolean).join(' · ')}</p>
                      {p.priceFrom ? <p className="text-xs font-bold mt-1.5" style={{ color: 'var(--teal)' }}>From {formatPrice(p.priceFrom)}</p> : null}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      <ReviewsSection type="building" slug={building.slug} name={building.name} />

      <RealEstateLinks emirate={building.emirate} near={building.name} />

      <FaqSection title={`${building.name}: frequently asked questions`} faqs={faqs} />

      <Footer />
    </div>
  )
}
