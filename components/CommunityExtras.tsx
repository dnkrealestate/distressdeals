import Link from 'next/link'
import { ArrowRight, BadgePercent, GraduationCap, Layers, Plane, ShoppingBag, Stethoscope, Coffee } from 'lucide-react'

// Extra, server-rendered sections for a community page — every fact here comes from data (our listings, OpenStreetMap
// schools and hospitals, the UAE airports list, the community guides), never from a template guess.
export interface NearPoint { _id: string; name: string; distanceKm?: number; subcategory?: string }
export interface Around { schools: NearPoint[]; hospitals: NearPoint[]; shopping: NearPoint[]; cafes: NearPoint[]; airports: NearPoint[] }
export interface NearbyCommunity { name: string; slug: string; area?: string; distanceKm?: number }

const enc = encodeURIComponent
const km = (d?: number) => (d == null ? '' : d < 1 ? `${Math.max(50, Math.round(d * 20) * 50)} m` : `${d} km`)

// "Distress deals in X" — what a distress sale means here and where to go next, for buyers and for sellers.
export function DistressSection({ name, listed }: { name: string; listed: number }) {
  return (
    <section className="pb-12" aria-labelledby="distress-deals">
      <div className="wrap">
        <div className="rounded-2xl p-6 md:p-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 id="distress-deals" className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <BadgePercent size={17} style={{ color: 'var(--teal)' }} /> Distress deals and below-market property in {name}
          </h2>
          <div className="text-sm leading-relaxed space-y-3 max-w-3xl" style={{ color: 'var(--text-mid)' }}>
            <p>
              A distress sale in {name} is a property offered below its usual market value because the owner needs to sell quickly — a
              relocation, a mortgage or service-charge burden, a handover payment due on an off-plan unit, or simply a need for cash.
              The property itself is often in good condition; it is the seller&apos;s timeline that creates the discount.
            </p>
            <p>
              {listed > 0
                ? <>We currently have {listed} verified listing{listed === 1 ? '' : 's'} in {name}. Every one is checked by our team before it goes live, and each enquiry is handled by one dedicated agent from first message to transfer.</>
                : <>We have no live listings tagged to {name} right now. New distress sales appear first to buyers who have registered their search, so it is worth setting an alert.</>}
              {' '}Before you buy any discounted unit, compare it with recent sales in the same building, check the title deed and any
              outstanding mortgage or service charges, and confirm the seller&apos;s reason for the price — our{' '}
              <Link href="/distress-sale-dubai" className="font-semibold underline" style={{ color: 'var(--teal)' }}>distress sale guide</Link> explains each step.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 max-w-3xl">
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-alt)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Buying in {name}</p>
              <ul className="text-sm space-y-1.5">
                <li><Link href={`/for-sale?community=${enc(name)}`} className="hover:underline" style={{ color: 'var(--text)' }}>Property for sale in {name}</Link></li>
                <li><Link href={`/for-rent?community=${enc(name)}`} className="hover:underline" style={{ color: 'var(--text)' }}>Property for rent in {name}</Link></li>
                <li><Link href="/distress-sale-dubai" className="hover:underline" style={{ color: 'var(--text)' }}>How to buy a distress sale safely</Link></li>
              </ul>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-alt)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Selling in {name}</p>
              <ul className="text-sm space-y-1.5">
                <li><Link href="/sell-property-fast-dubai" className="hover:underline" style={{ color: 'var(--text)' }}>Sell your property fast</Link></li>
                <li><Link href="/free-property-valuation-dubai" className="hover:underline" style={{ color: 'var(--text)' }}>Free property valuation</Link></li>
                <li><Link href="/sell" className="hover:underline" style={{ color: 'var(--text)' }}>List your property in {name}</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PointList({ icon: Icon, title, points }: { icon: any; title: string; points: NearPoint[] }) {
  if (!points.length) return null
  return (
    <div className="card p-5">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}><Icon size={15} style={{ color: 'var(--teal)' }} /> {title}</h3>
      <ul className="space-y-2">
        {points.slice(0, 5).map(p => (
          <li key={p._id} className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0" style={{ color: 'var(--text-mid)' }}>{p.name}</span>
            <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{km(p.distanceKm)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Schools, hospitals, shops, cafés and the nearest airports — straight-line distances from the community's map pin.
export function DailyLifeSection({ name, around }: { name: string; around: Around }) {
  const any = around.schools.length + around.hospitals.length + around.shopping.length + around.cafes.length
  if (!any) return null
  const nearestAirport = around.airports[0]
  return (
    <section className="pb-12" aria-labelledby="daily-life">
      <div className="wrap">
        <h2 id="daily-life" className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>Schools, hospitals and daily life near {name}</h2>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
          The closest schools, hospitals and clinics, malls, supermarkets and cafés to {name}
          {nearestAirport ? `, and the nearest airport — ${nearestAirport.name}, ${km(nearestAirport.distanceKm)} away` : ''}. Distances are straight-line from the community&apos;s map position.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PointList icon={GraduationCap} title={`Schools near ${name}`} points={around.schools} />
          <PointList icon={Stethoscope} title={`Hospitals & clinics near ${name}`} points={around.hospitals} />
          <PointList icon={ShoppingBag} title="Malls & supermarkets" points={around.shopping} />
          <PointList icon={Coffee} title="Cafés & restaurants" points={around.cafes} />
        </div>
        {around.airports.length > 0 && (
          <p className="text-xs mt-4 flex flex-wrap items-center gap-x-3 gap-y-1" style={{ color: 'var(--text-muted)' }}>
            <Plane size={13} style={{ color: 'var(--teal)' }} />
            {around.airports.slice(0, 3).map(a => <span key={a._id}>{a.name}: <strong style={{ color: 'var(--text-mid)' }}>{km(a.distanceKm)}</strong></span>)}
          </p>
        )}
      </div>
    </section>
  )
}

// Links to the closest community guides, the area guide and the distress-sale guide.
export function NearbyCommunitiesSection({ name, area, nearby }: { name: string; area?: string; nearby: NearbyCommunity[] }) {
  if (!nearby.length && !area) return null
  return (
    <section className="pb-14" aria-labelledby="nearby-communities">
      <div className="wrap">
        <h2 id="nearby-communities" className="text-lg font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Layers size={16} style={{ color: 'var(--teal)' }} /> Communities near {name}
        </h2>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Compare property and prices in the neighbouring communities.</p>
        <div className="flex flex-wrap gap-2">
          {nearby.map(c => (
            <Link key={c.slug} href={`/communities/${c.slug}`} className="px-3.5 py-2 rounded-xl text-sm font-medium" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}>
              Property in {c.name}{c.distanceKm != null ? <span style={{ color: 'var(--text-muted)' }}> · {km(c.distanceKm)}</span> : null}
            </Link>
          ))}
          {area && area !== name && (
            <Link href={`/areas/${area.toLowerCase().trim().replace(/\s+/g, '-')}`} className="px-3.5 py-2 rounded-xl text-sm font-medium" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}>
              {area} area guide
            </Link>
          )}
          <Link href="/distress-sale-dubai" className="px-3.5 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1" style={{ background: 'rgba(203,1,1,0.08)', color: 'var(--teal)' }}>
            Distress sale Dubai guide <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  )
}
