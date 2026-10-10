import { cache } from 'react'
import Image from 'next/image'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Clock, Globe, Wallet, CalendarClock, Hourglass, Star, Navigation, Sparkles, Lightbulb, Building2, UtensilsCrossed } from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import PlaceCard from '@/components/explore/PlaceCard'
import PlaceMap from '@/components/explore/PlaceMap'
import ReviewsSection from '@/components/shared/ReviewsSection'
import RealEstateLinks from '@/components/shared/RealEstateLinks'
import FaqSection, { type Faq } from '@/components/shared/FaqSection'
import { placeAPI } from '@/lib/api'
import { shareImages, fitTitle, fitDescription } from '@/lib/seo'
import { formatPrice } from '@/lib/utils'
import { EXPLORE_SECTIONS, sectionByKey, sectionByPath, placeHref, sectionHref, emirateFromSlug } from '@/lib/explore'
import { placeTitle, placeDescription, placeKeywords, placeJsonLd } from '@/lib/placeSeo'
import SectionList, { sectionListMetadata, type ListParams } from '@/components/explore/SectionList'
import type { PlaceDetail } from '@/types'

export const revalidate = 120

const getPlace = cache(async (slug: string): Promise<PlaceDetail | null> => {
  try {
    const res = await placeAPI.getBySlug(slug)
    return res.data.success ? res.data.data : null
  } catch { return null }
})

const whereOf = (p: PlaceDetail) => [p.area && p.area !== p.emirate ? p.area : '', p.emirate].filter(Boolean).join(', ')

type Props = { params: { category: string; slug: string }; searchParams?: ListParams }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  // /explore/malls/dubai — the section's page for one emirate.
  const listSection = sectionByPath(params.category), emirate = emirateFromSlug(params.slug)
  if (listSection && emirate) return sectionListMetadata(listSection, emirate, searchParams)

  const place = await getPlace(params.slug)
  if (!place) return { title: 'Place Not Found', robots: { index: false, follow: false } }
  const title = placeTitle(place), description = placeDescription(place)
  const url = placeHref(place)
  const alt = `${place.name}, ${whereOf(place)}`
  return {
    title: fitTitle(title), description: fitDescription(description),
    keywords: placeKeywords(place),
    alternates: { canonical: url },
    // Indexed once the place has content of its own (photo + description, FAQs or reviews); links are always followed.
    robots: { index: place.indexable !== false, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    openGraph: { title, description, type: 'article', url, siteName: 'Distress Deals UAE', locale: 'en_AE', images: shareImages(place.heroImage, alt), ...(place.updatedAt ? { modifiedTime: place.updatedAt } : {}) },
    twitter: { card: 'summary_large_image', title, description, ...(place.heroImage ? { images: [{ url: place.heroImage, alt }] } : {}) },
    other: {
      ...(place.coordinates?.lat != null ? { 'geo.position': `${place.coordinates.lat};${place.coordinates.lng}`, ICBM: `${place.coordinates.lat}, ${place.coordinates.lng}` } : {}),
      'geo.placename': whereOf(place), 'geo.region': 'AE',
    },
  }
}

export default async function PlacePage({ params, searchParams }: Props) {
  const listSection = sectionByPath(params.category), listEmirate = emirateFromSlug(params.slug)
  if (listSection && listEmirate) return <SectionList section={listSection} emirate={listEmirate} searchParams={searchParams} />

  const place = await getPlace(params.slug)
  if (!place) notFound()
  const section = sectionByKey(place.category)!
  // One address per place: if it was opened under another section's path, send it to the right one.
  if (sectionByPath(params.category)?.key !== place.category) permanentRedirect(placeHref(place))

  const where = whereOf(place)
  const c = place.coordinates?.lat != null ? place.coordinates : null
  const mapsUrl = c ? `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}` : null
  const paragraphs = (place.overview || '').split(/\n{2,}/).map(s => s.trim()).filter(Boolean)
  const light = !!place.heroImage

  const facts = [
    place.openingHours && { icon: Clock, label: 'Opening hours', value: place.openingHours },
    place.priceLevel && { icon: Wallet, label: place.category === 'hotel' || place.category === 'food' ? 'Price range' : 'Entry', value: place.priceLevel },
    place.cuisine && { icon: UtensilsCrossed, label: 'Cuisine', value: place.cuisine },
    place.stars && { icon: Star, label: 'Rating', value: `${place.stars}-star` },
    place.duration && { icon: Hourglass, label: 'Time needed', value: place.duration },
    place.bestTime && { icon: CalendarClock, label: 'Best time to go', value: place.bestTime },
    place.website && { icon: Globe, label: 'Website', value: place.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''), href: place.website, external: true },
  ].filter(Boolean) as { icon: any; label: string; value: string; href?: string; external?: boolean }[]

  // FAQs: the written ones first, then answers built from the place's own details (never invented).
  const nearest = place.nearby.filter(n => n.distanceKm != null).slice(0, 3)
  const faqs: Faq[] = [
    ...(place.faqs || []),
    { q: `Where is ${place.name}?`, a: `${place.name} is in ${where}, United Arab Emirates.${place.address ? ` Address: ${place.address}.` : ''}${c ? ` Map position: ${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}.` : ''}` },
    place.openingHours ? { q: `What are the opening hours of ${place.name}?`, a: `${place.name} is open ${place.openingHours}. Hours can change on public holidays and during Ramadan, so check before you go.` } : { q: '', a: '' },
    place.priceLevel ? { q: place.category === 'hotel' || place.category === 'food' ? `How expensive is ${place.name}?` : `How much does it cost to visit ${place.name}?`, a: `${place.priceLevel}.` } : { q: '', a: '' },
    nearest.length ? { q: `What is near ${place.name}?`, a: `Nearby: ${nearest.map(n => `${n.name} (${n.distanceKm! < 1 ? `${Math.round(n.distanceKm! * 1000)} m` : `${n.distanceKm} km`})`).join(', ')}.` } : { q: '', a: '' },
    place.projects.length ? { q: `Are there properties for sale near ${place.name}?`, a: `Yes — ${place.projects.length} new project${place.projects.length === 1 ? '' : 's'} within a few kilometres, including ${place.projects.slice(0, 2).map(p => p.name).join(' and ')}.` } : { q: '', a: '' },
  ].filter((f, i, all) => f.q && all.findIndex(x => x.q.toLowerCase() === f.q.toLowerCase()) === i)

  // Page + place structured data (address, coordinates, photo credit, rating and the latest reviews).
  const jsonLd = placeJsonLd(place, placeDescription(place), place.reviews || [])
  const km = (d?: number) => (d == null ? '' : d < 1 ? `${Math.round(d * 1000)} m` : `${d} km`)
  const kind = (place.subcategory || section.singular).toLowerCase()

  return (
    <div className="page overflow-x-hidden">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      <section className="relative pt-20 pb-10 overflow-hidden" style={light ? { minHeight: 380 } : undefined}>
        {light ? (
          <>
            <Image src={place.heroImage!} alt={`${place.name} — ${kind} in ${where}`} title={place.name} fill priority sizes="100vw" quality={70} className="object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,8,8,0.45) 0%, rgba(8,8,8,0.35) 45%, var(--bg) 98%)' }} />
            {place.heroImageCredit?.name && (
              <a href={place.heroImageCredit.url} target="_blank" rel="noopener noreferrer nofollow"
                className="absolute top-20 right-4 z-10 text-[10px] px-2 py-0.5 rounded hover:underline" style={{ background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.85)' }}>
                Photo: {place.heroImageCredit.name}{place.heroImageCredit.license ? ` · ${place.heroImageCredit.license}` : ''}
              </a>
            )}
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, var(--bg) 0%, var(--bg-alt) 60%, rgba(203,1,1,0.06) 100%)' }} />
        )}
        <div className="wrap relative z-10" style={light ? { paddingTop: 90 } : undefined}>
          <nav aria-label="Breadcrumb" className="text-xs mb-4" style={{ color: light ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>
            <Link href="/explore" className="hover:underline">UAE Explore</Link> / <Link href={sectionHref(section)} className="hover:underline">{section.label}</Link>
            {' '}/ <Link href={sectionHref(section, place.emirate)} className="hover:underline">{place.emirate}</Link> / <span aria-current="page">{place.name}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="badge badge-teal text-[11px]" style={light ? { background: 'rgba(255,255,255,0.16)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' } : undefined}>
              {place.subcategory || section.label}
            </span>
            {place.ratingCount > 0 && (
              <a href="#reviews" className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: light ? '#fff' : 'var(--text)' }}>
                <Star size={13} fill="#F59E0B" stroke="#F59E0B" /> {place.ratingAvg.toFixed(1)} <span style={{ opacity: 0.75 }}>({place.ratingCount} review{place.ratingCount === 1 ? '' : 's'})</span>
              </a>
            )}
          </div>
          <h1 className="heading-xl mb-3 max-w-4xl" style={light ? { color: '#fff' } : undefined}>{place.name}</h1>
          <p className="text-sm flex items-center gap-1.5" style={{ color: light ? 'rgba(255,255,255,0.9)' : 'var(--text-muted)' }}>
            <MapPin size={14} style={{ color: light ? '#fff' : 'var(--teal)' }} /> {place.address || where}
          </p>
          <div className="flex flex-wrap gap-2.5 mt-6">
            {mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener noreferrer nofollow" className="btn-primary h-10 px-5 text-sm"><Navigation size={15} /> Get directions</a>}
            <a href="#reviews" className="btn-outline h-10 px-5 text-sm" style={light ? { background: 'rgba(255,255,255,0.92)' } : undefined}><Star size={15} /> Write a review</a>
          </div>
        </div>
      </section>

      <section className="pb-12 pt-4">
        <div className="wrap grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-8">
          <article className="min-w-0">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Sparkles size={16} style={{ color: 'var(--teal)' }} /> About {place.name}
            </h2>
            {place.summary && <p className="text-base leading-relaxed mb-4 font-medium" style={{ color: 'var(--text)' }}>{place.summary}</p>}
            {paragraphs.map((p, i) => <p key={i} className="text-sm leading-7 mb-4" style={{ color: 'var(--text-mid)' }}>{p}</p>)}

            {!!place.highlights?.length && (
              <>
                <h2 className="text-base font-bold mt-8 mb-3" style={{ color: 'var(--text)' }}>Highlights</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {place.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-mid)' }}>
                      <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: 'var(--teal)' }} /> {h}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {!!place.tips?.length && (
              <div className="card p-5 mt-8" style={{ background: 'var(--bg-alt)' }}>
                <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Lightbulb size={16} style={{ color: 'var(--teal)' }} /> Good to know
                </h2>
                <ul className="space-y-2">
                  {place.tips.map((t, i) => <li key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-mid)' }}>• {t}</li>)}
                </ul>
              </div>
            )}

            {!!place.gallery?.length && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8">
                {place.gallery.map((g, i) => <img key={i} src={g} alt={`${place.name}, ${where} — photo ${i + 1}`} loading="lazy" className="w-full h-36 object-cover rounded-xl" />)}
              </div>
            )}

            {/* Where it is and what is around it — written from the place's own map data */}
            <h2 className="text-base font-bold mt-8 mb-3" style={{ color: 'var(--text)' }}>Where is {place.name}?</h2>
            <p className="text-sm leading-7" style={{ color: 'var(--text-mid)' }}>
              {place.name} is {place.area && place.area !== place.emirate ? <>in {place.area}, in the emirate of </> : <>in the emirate of </>}
              <Link href={sectionHref(section, place.emirate)} className="font-semibold hover:underline" style={{ color: 'var(--text)' }}>{place.emirate}</Link>, United Arab Emirates
              {place.address ? <> — {place.address}</> : null}.
              {nearest.length > 0 && <> The closest places in this guide are {nearest.map((n, i) => (
                <span key={n._id}>{i > 0 ? (i === nearest.length - 1 ? ' and ' : ', ') : ''}<Link href={placeHref(n)} className="font-semibold hover:underline" style={{ color: 'var(--text)' }}>{n.name}</Link> ({km(n.distanceKm)})</span>
              ))}.</>}
              {mapsUrl && <> Use <a href={mapsUrl} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold hover:underline" style={{ color: 'var(--teal)' }}>Get directions</a> for a route from where you are.</>}
            </p>
            {place.updatedAt && (
              <p className="text-[11px] mt-6" style={{ color: 'var(--text-muted)' }}>
                Last updated <time dateTime={place.updatedAt}>{new Date(place.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</time>. Details can change — check with the venue before you go.
              </p>
            )}
          </article>

          <aside className="space-y-5">
            {facts.length > 0 && (
              <div className="card p-5">
                <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>Visitor information</h2>
                <dl className="space-y-3.5">
                  {facts.map(f => (
                    <div key={f.label} className="flex gap-3">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.08)' }}>
                        <f.icon size={15} style={{ color: 'var(--teal)' }} />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{f.label}</dt>
                        <dd className="text-sm font-medium" style={{ color: 'var(--text)', overflowWrap: 'anywhere' }}>
                          {f.href ? <a href={f.href} className="hover:underline" {...(f.external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}>{f.value}</a> : f.value}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {c && (
              <div className="card overflow-hidden">
                <div className="h-64"><PlaceMap id={place._id} lat={c.lat} lng={c.lng} landmarks={place.nearby.filter(n => n.coordinates?.lat != null).map(n => ({ lat: n.coordinates!.lat, lng: n.coordinates!.lng, title: n.name }))} /></div>
                <div className="p-4">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Location</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{place.address || where}</p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{c.lat.toFixed(5)}, {c.lng.toFixed(5)}</p>
                  {mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-xs font-semibold mt-2 inline-flex items-center gap-1" style={{ color: 'var(--teal)' }}><Navigation size={12} /> Open in Google Maps</a>}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      {place.projects.length > 0 && (
        <section className="pb-12">
          <div className="wrap">
            <h2 className="text-lg font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Building2 size={17} style={{ color: 'var(--teal)' }} /> Live near {place.name}
            </h2>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>New projects within a short drive.</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {place.projects.map(p => {
                const img = p.coverImage || p.images?.[0]?.url
                return (
                  <Link key={p._id} href={`/projects/${p.slug}`} className="card-hover group overflow-hidden flex flex-col">
                    <div className="h-32 relative overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                      {img && <img src={img} alt={p.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
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

      <RealEstateLinks emirate={place.emirate} near={place.name} />

      <ReviewsSection type="place" slug={place.slug} name={place.name} />

      {place.nearby.length > 0 && (
        <section className="pb-14">
          <div className="wrap">
            <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--text)' }}>More to explore near {place.name}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {place.nearby.slice(0, 8).map(n => <PlaceCard key={n._id} place={n} compact />)}
            </div>
          </div>
        </section>
      )}

      <FaqSection title={`${place.name}: frequently asked questions`} faqs={faqs} />

      {/* Internal links: the same kind of place in this emirate, and the other sections there */}
      <section className="pb-16">
        <div className="wrap">
          <div className="card p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            {!!place.related?.length && (
              <div>
                <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>More {section.label.toLowerCase()} in {place.emirate}</h2>
                <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {place.related.map(r => <li key={r.slug}><Link href={placeHref(r)} className="text-xs hover:underline" style={{ color: 'var(--text-mid)' }}>{r.name}</Link></li>)}
                  <li><Link href={sectionHref(section, place.emirate)} className="text-xs font-semibold hover:underline" style={{ color: 'var(--teal)' }}>All {section.label.toLowerCase()} in {place.emirate}</Link></li>
                </ul>
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>Explore {place.emirate}</h2>
              <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                {EXPLORE_SECTIONS.filter(s => s.key !== section.key).map(s => (
                  <li key={s.key}><Link href={sectionHref(s, place.emirate)} className="text-xs hover:underline" style={{ color: 'var(--text-mid)' }}>{s.label} in {place.emirate}</Link></li>
                ))}
                <li><Link href="/communities" className="text-xs hover:underline" style={{ color: 'var(--text-mid)' }}>Communities</Link></li>
                <li><Link href="/projects" className="text-xs hover:underline" style={{ color: 'var(--text-mid)' }}>New projects</Link></li>
                <li><Link href="/for-sale" className="text-xs hover:underline" style={{ color: 'var(--text-mid)' }}>Properties for sale</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
