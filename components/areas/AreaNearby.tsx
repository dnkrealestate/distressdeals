'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { HeartPulse, GraduationCap, Landmark, TrainFront, ShoppingBag, Store, MapPin, ArrowUpRight } from 'lucide-react'
import { placeHref } from '@/lib/explore'
import type { AreaNearby as Nearby, NearbyCategory } from '@/types'
import ScrollRow from '@/components/shared/ScrollRow'

// "Nearby places" on an area page: hospitals, schools, tourist places, metro, malls and everyday places, each with its
// straight-line distance from the area's centre, and a map of the selected group. Collected automatically
// (backend services/areaAutoService.ts) from OpenStreetMap and our own Explore guides.

const LocationMap = dynamic(() => import('@/components/shared/LocationMap'), { ssr: false, loading: () => <div className="w-full h-full animate-pulse" style={{ background: 'var(--bg-alt)' }} /> })

const GROUPS: { key: NearbyCategory; label: string; icon: any }[] = [
  { key: 'hospital', label: 'Hospitals & clinics', icon: HeartPulse },
  { key: 'school', label: 'Schools', icon: GraduationCap },
  { key: 'tourist', label: 'Tourist places', icon: Landmark },
  { key: 'metro', label: 'Metro stations', icon: TrainFront },
  { key: 'mall', label: 'Malls', icon: ShoppingBag },
  { key: 'other', label: 'Others', icon: Store },
]
const KIND: Record<string, string> = {
  hospital: 'Hospital', clinic: 'Clinic', school: 'School', kindergarten: 'Nursery', university: 'University', college: 'College',
  metro: 'Metro', tram: 'Tram', station: 'Station', mall: 'Mall', museum: 'Museum', theme_park: 'Theme park', zoo: 'Zoo', aquarium: 'Aquarium',
  water_park: 'Water park', attraction: 'Attraction', activity: 'Activity', market: 'Market', supermarket: 'Supermarket', pharmacy: 'Pharmacy', park: 'Park',
}

export default function AreaNearby({ area, center, nearby, updatedAt }: { area: string; center?: { lat: number; lng: number }; nearby: Nearby[]; updatedAt?: string }) {
  const groups = useMemo(() => GROUPS.map(g => ({ ...g, items: nearby.filter(n => n.category === g.key) })).filter(g => g.items.length), [nearby])
  const [active, setActive] = useState<NearbyCategory>(groups[0]?.key || 'hospital')
  if (!groups.length) return null
  const current = groups.find(g => g.key === active) || groups[0]
  const usesOsm = nearby.some(n => n.source === 'osm')

  return (
    <section className="pb-4" aria-labelledby="nearby-heading">
      <div className="wrap">
        <div className="card p-5 sm:p-6">
          <h2 id="nearby-heading" className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>Amenities &amp; nearby places in {area}</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Hospitals, schools, tourist places, metro stations, malls and everyday places around {area}.</p>

          <ScrollRow className="mb-4" role="tablist">
            {groups.map(g => (
              <button key={g.key} type="button" role="tab" aria-selected={g.key === current.key} onClick={() => setActive(g.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors"
                style={{ border: `1px solid ${g.key === current.key ? 'var(--teal)' : 'var(--border)'}`, background: g.key === current.key ? 'var(--teal)' : 'var(--surface)', color: g.key === current.key ? '#fff' : 'var(--text-mid)' }}>
                <g.icon size={13} /> {g.label} <span className="opacity-75">{g.items.length}</span>
              </button>
            ))}
          </ScrollRow>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <ul className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-2 content-start" role="tabpanel">
              {current.items.map(n => {
                const inner = (
                  <>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.08)' }}><current.icon size={15} style={{ color: 'var(--teal)' }} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{n.name}</span>
                      <span className="block text-[11px]" style={{ color: 'var(--text-muted)' }}>{KIND[n.placeCategory || n.kind || ''] || current.label}</span>
                    </span>
                    <span className="text-xs font-bold whitespace-nowrap px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-alt)', color: 'var(--text-mid)' }}>{n.distanceKm} km</span>
                    {n.placeSlug && <ArrowUpRight size={13} style={{ color: 'var(--text-muted)' }} />}
                  </>
                )
                const cls = 'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors'
                const style = { border: '1px solid var(--border)', background: 'var(--surface)' }
                return (
                  <li key={`${n.name}-${n.lat}`}>
                    {n.placeSlug && n.placeCategory
                      ? <Link href={placeHref({ category: n.placeCategory, slug: n.placeSlug })} className={`${cls} hover:border-[rgba(203,1,1,0.4)]`} style={style}>{inner}</Link>
                      : <div className={cls} style={style}>{inner}</div>}
                  </li>
                )
              })}
            </ul>
            {center && (
              <div className="lg:col-span-2 rounded-xl overflow-hidden h-64 lg:h-auto lg:min-h-[280px]" style={{ border: '1px solid var(--border)' }}>
                <LocationMap key={current.key} lat={center.lat} lng={center.lng} zoom={13} landmarks={current.items.map(n => ({ lat: n.lat, lng: n.lng, title: `${n.name} · ${n.distanceKm} km` }))} />
              </div>
            )}
          </div>

          {current.key === 'metro' && (
            <p className="text-[11px] mt-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', color: 'var(--text-mid)' }}>
              Stations as mapped in OpenStreetMap — this can include stations still under construction (such as Dubai Metro Blue Line). Check opening status with the RTA.
            </p>
          )}
          <p className="flex flex-wrap items-center gap-x-1 text-[11px] mt-4" style={{ color: 'var(--text-muted)' }}>
            <MapPin size={11} /> Straight-line distances from the centre of {area}.
            {usesOsm && <> Place data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap contributors</a>.</>}
            {updatedAt && <span suppressHydrationWarning> Updated {new Date(updatedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}.</span>}
          </p>
        </div>
      </div>
    </section>
  )
}
