'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { History, Sparkles, Eye, MapPin } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { feedAPI } from '@/lib/api'
import { feedVisitorId } from '@/lib/feed'
import PropertyCard from '@/components/buyer/PropertyCard'
import ProjectCard from '@/components/buyer/ProjectCard'
import FeedTracked from './FeedTracked'

// Above the For Sale feed: "Continue Browsing" (once something was opened), "Recommended for You" and "Because you
// viewed …" (only once the visitor has done enough for them to mean something — the server decides). Renders nothing
// for a brand-new visitor. The cards follow the page's own view: rows in List view, the same grid in Grid view.
type Card = { kind: 'property' | 'project'; src: string; item: any }
interface Sections { continue: Card[]; recommended: { title: string; reason: string; items: Card[] } | null; because: { key: string; title: string; items: Card[] }[] }

// "Continue Browsing" is its own panel — small thumbnails of what was opened, nothing like the listing cards below —
// so it reads as history, not as more results.
function ContinueBrowsing({ items }: { items: Card[] }) {
  if (!items.length) return null
  return (
    <section className="mb-7 rounded-2xl p-4" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-3">
        <History size={15} style={{ color: 'var(--teal)' }} />
        <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Continue Browsing</h2>
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Recently viewed</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
        {items.map((c, i) => {
          const p = c.item
          const href = c.kind === 'project' ? `/projects/${p.slug}` : `/buyer/properties/${p.slug || p._id}`
          const image = c.kind === 'project' ? (p.coverImage || p.images?.[0]?.url) : (p.images?.find((x: any) => x.isPrimary)?.url || p.images?.[0]?.url)
          const area = c.kind === 'project' ? p.area : p.location?.area
          const price = c.kind === 'project' ? p.priceFrom : p.price
          return (
            <FeedTracked key={`${c.kind}-${p._id}`} kind={c.kind} id={p._id} src={c.src} position={i} className="flex-shrink-0">
              <Link href={href} className="flex items-center gap-3 w-[260px] rounded-xl p-2 transition-colors hover:bg-[var(--surface)]" style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" loading="lazy" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" style={{ background: 'var(--bg-alt)' }} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{p.title}</span>
                  {area && <span className="flex items-center gap-1 text-[11px] truncate" style={{ color: 'var(--text-muted)' }}><MapPin size={10} />{area}</span>}
                  {price > 0 && <span className="block text-xs font-bold mt-0.5" style={{ color: 'var(--teal)' }}>{c.kind === 'project' ? 'From ' : ''}{formatPrice(price)}</span>}
                </span>
              </Link>
            </FeedTracked>
          )
        })}
      </div>
    </section>
  )
}

function Row({ title, subtitle, icon: Icon, items, view }: { title: string; subtitle?: string; icon: any; items: Card[]; view: 'grid' | 'list' }) {
  if (!items.length) return null
  // Same layout and card style as the list below; a short list each, so the feed itself is never pushed far down.
  const shown = items.slice(0, view === 'list' ? 3 : 6)
  return (
    <section className="mb-7">
      <div className="flex items-baseline gap-2 mb-3">
        <Icon size={15} style={{ color: 'var(--teal)' }} className="self-center" />
        <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>{title}</h2>
        {subtitle && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</span>}
      </div>
      <div className={view === 'grid' ? 'grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-4'}>
        {shown.map((c, i) => (
          <FeedTracked key={`${c.kind}-${c.item._id}`} kind={c.kind} id={c.item._id} src={c.src} position={i}>
            {c.kind === 'project'
              ? <ProjectCard project={c.item} layout={view === 'grid' ? 'grid' : 'row'} markAsProject />
              : <PropertyCard property={c.item} layout={view === 'grid' ? 'grid' : 'row'} />}
          </FeedTracked>
        ))}
      </div>
    </section>
  )
}

// One request per visitor for a short while — the list re-renders this block as it loads.
let cached: { id: string; at: number; p: Promise<any> } | null = null
const loadSections = (id: string) => {
  if (!cached || cached.id !== id || Date.now() - cached.at > 30_000) cached = { id, at: Date.now(), p: feedAPI.sections(id).then(r => (r.data.success ? r.data.data : null)).catch(() => null) }
  return cached.p
}

// `onShown`: the ids this block shows (recently viewed + recommendation cards), so the feed below leaves them out — no listing twice.
export default function FeedSections({ view = 'grid', onShown }: { view?: 'grid' | 'list'; onShown?: (ids: string[]) => void }) {
  const [data, setData] = useState<Sections | null>(null)
  useEffect(() => {
    const id = feedVisitorId()
    if (!id) return
    let alive = true
    loadSections(id).then(d => {
      if (!alive || !d) return
      setData(d)
      const shownIds = [...(d.continue || []), ...(d.recommended?.items || []).slice(0, view === 'list' ? 3 : 6), ...d.because.flatMap((b: any) => b.items.slice(0, view === 'list' ? 3 : 6))].map((c: Card) => c.item._id)
      onShown?.(shownIds)
    })
    return () => { alive = false }
  }, [view]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!data) return null
  return (
    <div>
      <ContinueBrowsing items={data.continue} />
      {data.recommended && <Row title={data.recommended.title} subtitle={data.recommended.reason} icon={Sparkles} items={data.recommended.items} view={view} />}
      {data.because.map(b => <Row key={b.key} title={b.title} icon={Eye} items={b.items} view={view} />)}
    </div>
  )
}
