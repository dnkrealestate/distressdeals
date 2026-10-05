'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Landmark, Coffee, ShoppingBag, MapPin, Star, Navigation } from 'lucide-react'
import ProjectCard from '@/components/buyer/ProjectCard'
import PropertyCard from '@/components/buyer/PropertyCard'
import { projectAPI, propertyAPI } from '@/lib/api'
import { placeHref, sectionByKey } from '@/lib/explore'
import type { Place, Project, Property } from '@/types'

type Near<T> = T & { distanceKm?: number }
interface More {
  developerProjects: Project[]
  developerProperties: Property[]
  nearbyProjects: Near<Project>[]
  nearbyProperties: Near<Property>[]
  places: { tourist: Place[]; cafes: Place[]; shopping: Place[] }
  approximate: boolean
}

const distance = (km?: number) => (km == null ? '' : km < 1 ? `${Math.max(50, Math.round(km * 20) * 50)} m` : `${km} km`)
const devSlug = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

// A heading with an optional "View all", then a row of cards that scrolls sideways on every screen size.
function Row({ title, accent, note, href, children }: { title: string; accent: string; note?: string; href?: string; children: React.ReactNode }) {
  return (
    <div className="mt-14">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h2 className="heading-md mb-1.5">{title} <span className="grad-text">{accent}</span></h2>
          {note && <p className="muted">{note}</p>}
        </div>
        {href && <Link href={href} className="btn-ghost btn-sm flex-shrink-0">View all</Link>}
      </div>
      {/* Sideways only: the padding leaves room for the cards' shadow and hover lift, so nothing needs to scroll up/down. */}
      <div className="flex gap-5 overflow-x-auto overflow-y-hidden scrollbar-hide -mx-2 px-2 pt-3 pb-6 -mt-3 -mb-3"
        style={{ scrollSnapType: 'x mandatory', overscrollBehaviorX: 'contain', touchAction: 'pan-x pan-y' }}>{children}</div>
    </div>
  )
}

function Slide({ km, children }: { km?: number; children: React.ReactNode }) {
  return (
    <div className="flex-shrink-0 w-[280px] sm:w-[320px] flex flex-col" style={{ scrollSnapAlign: 'start', scrollMarginLeft: 8 }}>
      <div className="flex-1">{children}</div>
      {km != null && (
        <p className="flex items-center justify-center gap-1 text-xs font-medium mt-2" style={{ color: 'var(--text-muted)' }}>
          <Navigation size={11} style={{ color: 'var(--teal)' }} /> {distance(km)} away
        </p>
      )}
    </div>
  )
}

// The small "what is around" lists — name, kind and distance, each linking to its page in UAE Explore.
function PlaceList({ icon: Icon, title, places }: { icon: any; title: string; places: Place[] }) {
  if (!places.length) return null
  return (
    <div className="min-w-0">
      <h3 className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
        <Icon size={15} style={{ color: 'var(--teal)' }} /> {title}
      </h3>
      <ul className="space-y-0.5">
        {places.map((p, i) => (
          <li key={p._id} className={i >= 4 ? 'hidden sm:block' : undefined}>
            <Link href={placeHref(p)} className="group flex items-center gap-2.5 py-1.5 px-2 -mx-2 rounded-lg transition-colors hover:bg-[var(--bg-alt)]">
              <span className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-alt)' }}>
                {p.heroImage
                  ? <img src={p.heroImage} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  : <Icon size={15} style={{ color: 'var(--teal)', opacity: 0.5 }} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium truncate group-hover:underline" style={{ color: 'var(--text)' }}>{p.name}</span>
                <span className="flex items-center gap-1.5 text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                  {p.subcategory || p.cuisine || sectionByKey(p.category)?.label}
                  {p.ratingCount > 0 && <span className="inline-flex items-center gap-0.5"><Star size={10} fill="currentColor" style={{ color: '#F59E0B' }} />{p.ratingAvg.toFixed(1)}</span>}
                </span>
              </span>
              {p.distanceKm != null && <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: 'var(--text-mid)' }}>{distance(p.distanceKm)}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

// "More options" under a project or a listing: the same developer's other work, the nearest projects and listings,
// and a compact list of tourist places, cafés and shopping around it. `hideIds` keeps out listings the page already
// shows in another section.
export default function MoreOptions({ kind, slug, area, developer, hideIds = [] }: { kind: 'project' | 'property'; slug: string; area?: string; developer?: string; hideIds?: string[] }) {
  const [more, setMore] = useState<More | null>(null)

  useEffect(() => {
    let alive = true
    setMore(null)
    ;(kind === 'project' ? projectAPI.getMore(slug) : propertyAPI.getMore(slug))
      .then(r => { if (alive && r.data.success) setMore(r.data.data) })
      .catch(() => {})
    return () => { alive = false }
  }, [kind, slug])

  if (!more) return null
  const hidden = new Set(hideIds)
  const devProperties = more.developerProperties.filter(p => !hidden.has(p._id))
  const nearProperties = more.nearbyProperties.filter(p => !hidden.has(p._id))
  const { tourist, cafes, shopping } = more.places
  const hasPlaces = tourist.length + cafes.length + shopping.length > 0
  const where = area || 'this location'
  if (!more.developerProjects.length && !devProperties.length && !more.nearbyProjects.length && !nearProperties.length && !hasPlaces) return null

  return (
    <div>
      {hasPlaces && (
        <div className="mt-14 rounded-2xl p-5 sm:p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 mb-4">
            <h2 className="flex items-center gap-2 text-base font-semibold" style={{ color: 'var(--text)' }}>
              <MapPin size={16} style={{ color: 'var(--teal)' }} /> What's near {where}
            </h2>
            <Link href="/explore" className="text-xs font-semibold" style={{ color: 'var(--teal)' }}>Explore the UAE →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
            <PlaceList icon={Landmark} title="Tourist places" places={tourist} />
            <PlaceList icon={Coffee} title="Cafés & restaurants" places={cafes} />
            <PlaceList icon={ShoppingBag} title="Malls & markets" places={shopping} />
          </div>
          <p className="text-[11px] mt-4" style={{ color: 'var(--text-muted)' }}>
            {more.approximate ? `Places around ${where}.` : 'Distances are straight-line from the map pin, not driving distance.'}
          </p>
        </div>
      )}

      {(more.developerProjects.length > 0 || devProperties.length > 0) && developer && (
        <Row title="More from" accent={developer} note={`Other projects and properties by ${developer}`} href={`/developers/${devSlug(developer)}`}>
          {more.developerProjects.map(p => <Slide key={p._id}><ProjectCard project={p} /></Slide>)}
          {devProperties.map(p => <Slide key={p._id}><PropertyCard property={p} /></Slide>)}
        </Row>
      )}

      {more.nearbyProjects.length > 0 && (
        <Row title="Nearby" accent="projects" note={`New projects in and around ${where}, nearest first`} href={area ? `/projects?area=${encodeURIComponent(area)}` : '/projects'}>
          {more.nearbyProjects.map(p => <Slide key={p._id} km={p.distanceKm}><ProjectCard project={p} /></Slide>)}
        </Row>
      )}

      {nearProperties.length > 0 && (
        <Row title="Nearby" accent="properties" note={`Properties for sale and rent in and around ${where}, nearest first`} href={area ? `/buyer/properties?area=${encodeURIComponent(area)}` : '/buyer/properties'}>
          {nearProperties.map(p => <Slide key={p._id} km={p.distanceKm}><PropertyCard property={p} /></Slide>)}
        </Row>
      )}
    </div>
  )
}
