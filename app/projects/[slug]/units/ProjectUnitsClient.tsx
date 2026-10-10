'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, MapPin, BedDouble, Bath, Maximize2, CalendarClock, Wallet, Camera, LayoutGrid, Rows3, Tag, Layers,
  BadgeCheck, MessageCircleHeart, Share2, Sparkles, Building2, ArrowUpDown, Map as MapIcon, TrendingDown, Timer, Images, Flame,
} from 'lucide-react'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import ImageLightbox from '@/components/shared/ImageLightbox'
import ProjectInterestModal from '@/components/buyer/ProjectInterestModal'
import { OfferBanner, OfferGifts } from '@/components/buyer/OfferParts'
import { OpportunityBadges, dealClaim, MARKET_DISCLAIMER } from '@/components/buyer/OpportunityBadges'
import { AMENITY_META } from '@/lib/amenities'
import { formatPrice } from '@/lib/utils'
import { offerPrice, liveOffer, offerTitle, offerEnds, offerSavingPct } from '@/lib/offer'
import type { ProjectGroup, ProjectGroupUnit } from '@/types'

// The whole project on one page: every photo, launch price / payment plans / handover, live offers highlighted at the
// top, then a unit explorer — filter by bedrooms, type or deals, sort, cards or a comparison table, price per sq ft,
// below-market figures (only where the server has a real reference), and an enquiry button on every unit.

const bedsOf = (u: ProjectGroupUnit) => {
  const t = String(u.bedrooms || '').toLowerCase()
  if (/studio/.test(t)) return 0
  const m = t.match(/\d+/)
  return m ? Number(m[0]) : null
}
const bedsLabel = (n: number | null) => (n === null ? 'Other' : n === 0 ? 'Studio' : `${n} Bed`)
const sizeOf = (u: ProjectGroupUnit) => { const m = String(u.sizeRange || '').replace(/,/g, '').match(/\d+(\.\d+)?/); return m ? Number(m[0]) : 0 }
const typeLabel = (t?: string) => (t ? t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Unit')
const priceOf = (u: ProjectGroupUnit) => offerPrice({ offer: u.offer }, u.priceFrom || 0) || u.priceFrom || 0
const claimOf = (u: ProjectGroupUnit) => dealClaim({ priceFrom: u.priceFrom || 0, opportunity: u.opportunity, offer: u.offer })
const SORTS = [
  { v: 'price_asc', l: 'Price: low → high' }, { v: 'price_desc', l: 'Price: high → low' },
  { v: 'size_desc', l: 'Size: largest' }, { v: 'ppsf_asc', l: 'Best AED / sq ft' }, { v: 'below_desc', l: 'Biggest saving' },
] as const

export default function ProjectUnitsClient({ group: g, slug }: { group: ProjectGroup; slug: string }) {
  const p = g.project
  const name = p.title.trim()
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [beds, setBeds] = useState<number | null | 'all'>('all')
  const [type, setType] = useState<string>('all')
  const [deals, setDeals] = useState<'all' | 'offer' | 'below'>('all')
  const [sort, setSort] = useState<(typeof SORTS)[number]['v']>('price_asc')
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const [enquire, setEnquire] = useState<{ id: string; title: string } | null>(null)

  const offerUnits = useMemo(() => g.units.filter(u => liveOffer(u)), [g.units])
  const belowUnits = useMemo(() => g.units.filter(u => claimOf(u)).sort((a, b) => claimOf(b)!.pct - claimOf(a)!.pct), [g.units])
  // The offer to headline: the unit with the biggest price saving, else the first unit with any offer (gifts, plan, DLD).
  const topOffer = useMemo(() => {
    const priced = offerUnits.filter(u => u.priceFrom && offerPrice(u, u.priceFrom))
    return priced.sort((a, b) => offerSavingPct(b.priceFrom!, offerPrice(b, b.priceFrom!)!) - offerSavingPct(a.priceFrom!, offerPrice(a, a.priceFrom!)!))[0] || offerUnits[0]
  }, [offerUnits])
  const bestSaving = topOffer?.priceFrom && offerPrice(topOffer, topOffer.priceFrom) ? offerSavingPct(topOffer.priceFrom, offerPrice(topOffer, topOffer.priceFrom)!) : 0
  const offerFrom = offerUnits.length ? Math.min(...offerUnits.map(priceOf).filter(Boolean)) : 0

  const bedOptions = useMemo(() => [...new Set(g.units.map(bedsOf))].sort((a, b) => (a ?? 99) - (b ?? 99)), [g.units])
  // Cheapest unit for each bedroom count — the quick "what does a 2-bed cost here" answer.
  const fromByBeds = useMemo(() => bedOptions.map(b => {
    const us = g.units.filter(u => bedsOf(u) === b && u.status !== 'sold_out')
    const min = Math.min(...us.map(priceOf).filter(Boolean))
    const sizes = us.map(sizeOf).filter(Boolean)
    return { beds: b, count: us.length, from: Number.isFinite(min) ? min : 0, sizeMin: sizes.length ? Math.min(...sizes) : 0, sizeMax: sizes.length ? Math.max(...sizes) : 0 }
  }).filter(x => x.count), [bedOptions, g.units])

  const shown = useMemo(() => {
    const list = g.units.filter(u => (beds === 'all' || bedsOf(u) === beds) && (type === 'all' || u.type === type)
      && (deals === 'all' || (deals === 'offer' ? !!liveOffer(u) : !!claimOf(u))))
    const ppsf = (u: ProjectGroupUnit) => (sizeOf(u) ? priceOf(u) / sizeOf(u) : Infinity)
    const saving = (u: ProjectGroupUnit) => Math.max(claimOf(u)?.pct || 0, u.priceFrom && offerPrice(u, u.priceFrom) ? offerSavingPct(u.priceFrom, offerPrice(u, u.priceFrom)!) : 0)
    return [...list].sort((a, b) => sort === 'price_desc' ? priceOf(b) - priceOf(a) : sort === 'size_desc' ? sizeOf(b) - sizeOf(a)
      : sort === 'ppsf_asc' ? ppsf(a) - ppsf(b) : sort === 'below_desc' ? saving(b) - saving(a) : priceOf(a) - priceOf(b))
  }, [g.units, beds, type, deals, sort])

  const amenities = Object.entries(p.amenities || {}).filter(([, v]) => v).map(([k]) => ({ k, ...(AMENITY_META[k] || { label: k.replace(/([A-Z])/g, ' $1'), icon: Sparkles }) }))
  const share = () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (navigator.share) navigator.share({ title: name, url }).catch(() => {})
    else navigator.clipboard?.writeText(url).catch(() => {})
  }
  const showDeals = (d: 'offer' | 'below') => { setDeals(d); document.getElementById('units')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  // Our own map, focused on this project (the same link as the project page's "View on map").
  const mapHref = `/map-search?only=project:${p.slug}`
  const sizes = g.units.map(sizeOf).filter(Boolean)
  const facts = [
    { icon: Tag, label: 'Launch price', value: g.launchPrice ? `From ${formatPrice(g.launchPrice)}` : 'On request' },
    { icon: Wallet, label: 'Payment plan', value: g.paymentPlans.join(' · ') || '—' },
    { icon: CalendarClock, label: 'Handover', value: g.handovers.join(' · ') || '—' },
    { icon: Layers, label: 'Unit types', value: `${g.units.length} · ${g.types.map(typeLabel).join(', ')}` },
    { icon: BedDouble, label: 'Bedrooms', value: fromByBeds.map(x => bedsLabel(x.beds)).join(', ') || '—' },
    { icon: Maximize2, label: 'Sizes', value: sizes.length ? `${Math.min(...sizes).toLocaleString()} – ${Math.max(...sizes).toLocaleString()} sq ft` : '—' },
  ]
  const enquireUnit = (u: ProjectGroupUnit) => setEnquire({ id: u._id, title: `${name} — ${bedsLabel(bedsOf(u))} ${typeLabel(u.type)}` })

  return (
    <div className="page" style={{ overflowX: 'clip' }}>
      <Navbar />
      <div className="wrap pt-3 pb-12">
        <nav aria-label="Breadcrumb" className="text-xs mb-3 flex flex-wrap items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <Link href="/" className="hover:underline">Home</Link><span>/</span>
          <Link href="/projects" className="hover:underline">Projects</Link><span>/</span>
          <Link href={`/projects/${g.canonicalSlug}`} className="hover:underline">{name}</Link><span>/</span>
          <span style={{ color: 'var(--text)' }}>Unit types &amp; prices</span>
        </nav>

        {/* ── Live offer, highlighted first ── */}
        {topOffer && (() => {
          const o = liveOffer(topOffer)!, ends = offerEnds(o)
          return (
            <div className="rounded-2xl p-[1.5px] mb-3" style={{ background: 'linear-gradient(120deg, #CB0101, #FD7147, #F59E0B)' }}>
              <div className="rounded-[14px] px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2" style={{ background: 'var(--surface)' }}>
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: '#CB0101' }}><Sparkles size={14} /> {offerTitle(o, 'Limited-Time Offer')}</span>
                <span className="text-sm" style={{ color: 'var(--text)' }}>
                  {offerUnits.length === g.units.length ? 'On every unit type' : `On ${offerUnits.length} of ${g.units.length} unit types`}
                  {offerFrom > 0 && <> · from <b style={{ color: 'var(--teal)' }}>{formatPrice(offerFrom)}</b></>}
                  {bestSaving > 0 && <> · <b style={{ color: '#047857' }}>save up to {bestSaving}%</b></>}
                </span>
                <OfferGifts item={topOffer} max={3} />
                {ends && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold text-white" style={{ background: '#CB0101' }} suppressHydrationWarning><Timer size={11} /> {ends}</span>}
                <button type="button" onClick={() => showDeals('offer')} className="btn-primary btn-sm ml-auto">See offer units</button>
              </div>
            </div>
          )
        })()}

        {/* ── Gallery: a large mosaic, then every photo of every unit (each once) ── */}
        {g.gallery.length > 0 && (
          <>
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[240px] sm:h-[400px] rounded-2xl overflow-hidden">
              {g.gallery.slice(0, 5).map((src, i) => (
                <button key={src} type="button" onClick={() => setLightbox(i)}
                  className={`relative ${i === 0 ? 'col-span-4 row-span-2 sm:col-span-2' : 'hidden sm:block'}`} aria-label={`Open photo ${i + 1} of ${name}`}>
                  <Image src={src} alt={`${name} by ${p.developer}: photo ${i + 1}`} fill className="object-cover hover:scale-[1.02] transition-transform" sizes={i === 0 ? '(max-width:640px)100vw,50vw' : '25vw'} priority={i === 0} />
                </button>
              ))}
            </div>
            {g.gallery.length > 1 && (
              <div className="mt-2 mb-5">
                <p className="flex items-center gap-1.5 text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}><Images size={13} /> All {g.gallery.length} photos</p>
                <div className="flex gap-2 overflow-x-auto pb-1 snap-x" style={{ scrollbarWidth: 'thin' }}>
                  {g.gallery.map((src, i) => (
                    <button key={src} type="button" onClick={() => setLightbox(i)} className="relative flex-shrink-0 w-28 h-20 sm:w-32 sm:h-24 rounded-lg overflow-hidden snap-start" aria-label={`Open photo ${i + 1}`}>
                      <Image src={src} alt={`${name} photo ${i + 1}`} fill className="object-cover hover:opacity-90" sizes="128px" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              {p.developerLogo && <span className="relative w-16 h-7 rounded bg-white"><Image src={p.developerLogo} alt={p.developer} fill className="object-contain p-0.5" sizes="64px" /></span>}
              <span className="text-sm font-semibold" style={{ color: 'var(--teal)' }}>{p.developer}</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(22,163,74,0.10)', color: '#15803D' }}><BadgeCheck size={11} /> Verified</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text)' }}>{name}: Unit Types, Prices &amp; Payment Plan</h1>
            <p className="flex items-center gap-1.5 text-sm mt-1" style={{ color: 'var(--text-mid)' }}><MapPin size={14} style={{ color: 'var(--teal)' }} />{[p.community, p.area, p.emirate].filter(Boolean).join(', ')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={mapHref} className="btn-sm gap-1.5 inline-flex items-center rounded-xl font-semibold text-white shadow-md hover:opacity-95 transition-opacity" style={{ background: 'linear-gradient(120deg, #0F766E, #0EA5E9)', boxShadow: '0 4px 14px rgba(14,165,233,0.35)' }}><MapIcon size={13} /> View on our map</Link>
            <button type="button" onClick={share} className="btn-outline btn-sm gap-1.5"><Share2 size={13} /> Share</button>
            <button type="button" onClick={() => setEnquire({ id: p._id, title: name })} className="btn-primary btn-sm gap-1.5"><MessageCircleHeart size={13} /> I&apos;m Interested</button>
          </div>
        </div>

        {/* ── Key facts ── */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
          {facts.map(f => (
            <div key={f.label} className="card p-4">
              <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide font-semibold mb-1" style={{ color: 'var(--text-muted)' }}><f.icon size={12} style={{ color: 'var(--teal)' }} />{f.label}</p>
              <p className="text-sm font-bold" style={{ color: f.label === 'Launch price' ? 'var(--teal)' : 'var(--text)' }}>{f.value}</p>
            </div>
          ))}
        </div>

        {topOffer && <OfferBanner item={topOffer} normalPrice={topOffer.priceFrom || 0} className="mb-5" />}

        {/* ── Below market: one highlight; the units themselves are marked in the list below ── */}
        {belowUnits.length > 0 && (
          <div className="rounded-2xl p-[1.5px] mb-5" style={{ background: 'linear-gradient(120deg, #047857, #10B981, #34D399)' }}>
            <div className="rounded-[14px] px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2" style={{ background: 'var(--surface)' }}>
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: '#047857' }}><TrendingDown size={14} /> Below market price</span>
              <span className="text-sm" style={{ color: 'var(--text)' }}>
                {belowUnits.length === g.units.length ? 'Every unit type' : `${belowUnits.length} of ${g.units.length} unit types`} priced under the market
                {' '}· up to <b style={{ color: '#047857' }}>{Math.round(claimOf(belowUnits[0])!.pct * 10) / 10}% below</b>
                {' '}· from <b style={{ color: 'var(--teal)' }}>{formatPrice(Math.min(...belowUnits.map(u => claimOf(u)!.dealPrice)))}</b>
              </span>
              <button type="button" onClick={() => showDeals('below')} className="btn-sm ml-auto rounded-xl font-semibold text-white px-3" style={{ background: '#047857' }}>See below-market units</button>
              {belowUnits.some(u => u.opportunity?.basis === 'transactions') && <p className="w-full text-[10px]" style={{ color: 'var(--text-muted)' }}>{MARKET_DISCLAIMER}</p>}
            </div>
          </div>
        )}

        {/* ── Prices by bedroom ── */}
        {fromByBeds.length > 1 && (
          <div className="card p-5 mb-5">
            <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>{name} starting prices by bedroom</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {fromByBeds.map(x => (
                <button key={String(x.beds)} type="button" onClick={() => setBeds(x.beds)} className="text-left rounded-xl p-3 transition-colors"
                  style={{ border: `1px solid ${beds === x.beds ? 'rgba(203,1,1,0.45)' : 'var(--border)'}`, background: beds === x.beds ? 'rgba(203,1,1,0.05)' : 'var(--surface)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{bedsLabel(x.beds)} · {x.count} unit{x.count === 1 ? '' : 's'}</p>
                  <p className="text-base font-bold" style={{ color: 'var(--teal)' }}>{x.from ? formatPrice(x.from) : '—'}</p>
                  {x.sizeMin > 0 && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{x.sizeMin === x.sizeMax ? x.sizeMin.toLocaleString() : `${x.sizeMin.toLocaleString()}–${x.sizeMax.toLocaleString()}`} sq ft</p>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Unit explorer ── */}
        <div id="units" className="card p-5 mb-5 scroll-mt-20">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold" style={{ color: 'var(--text)' }}>All {name} unit types <span className="font-normal text-sm" style={{ color: 'var(--text-muted)' }}>· {shown.length} of {g.units.length}</span></h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <select className="select-field appearance-none pr-8 py-1.5 text-xs" value={sort} onChange={e => setSort(e.target.value as any)} aria-label="Sort units">
                  {SORTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                </select>
                <ArrowUpDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {([['cards', LayoutGrid, 'Cards'], ['table', Rows3, 'Table']] as const).map(([v, Icon, l]) => (
                  <button key={v} type="button" onClick={() => setView(v)} className="p-2" title={l} aria-label={`${l} view`}
                    style={{ background: view === v ? 'rgba(203,1,1,0.10)' : 'transparent', color: view === v ? 'var(--teal)' : 'var(--text-muted)' }}><Icon size={14} /></button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {(['all', ...bedOptions] as (number | null | 'all')[]).map(b => (
              <button key={String(b)} type="button" onClick={() => setBeds(b)} className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ border: `1px solid ${beds === b ? 'var(--teal)' : 'var(--border)'}`, background: beds === b ? 'var(--teal)' : 'var(--surface)', color: beds === b ? '#fff' : 'var(--text-mid)' }}>
                {b === 'all' ? 'All bedrooms' : bedsLabel(b)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {g.types.length > 1 && ['all', ...g.types].map(t => (
              <button key={t} type="button" onClick={() => setType(t)} className="px-3 py-1 rounded-full text-[11px] font-semibold"
                style={{ border: `1px solid ${type === t ? 'rgba(203,1,1,0.45)' : 'var(--border)'}`, color: type === t ? 'var(--teal)' : 'var(--text-muted)' }}>
                {t === 'all' ? 'All types' : typeLabel(t)}
              </button>
            ))}
            {(offerUnits.length > 0 || belowUnits.length > 0) && ([['all', 'All units'], ...(offerUnits.length ? [['offer', `On offer (${offerUnits.length})`]] : []), ...(belowUnits.length ? [['below', `Below market (${belowUnits.length})`]] : [])] as [typeof deals, string][]).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setDeals(v)} className="px-3 py-1 rounded-full text-[11px] font-semibold"
                style={{ border: `1px solid ${deals === v ? 'rgba(4,120,87,0.5)' : 'var(--border)'}`, color: deals === v ? '#047857' : 'var(--text-muted)', background: deals === v ? 'rgba(16,185,129,0.08)' : 'transparent' }}>
                {l}
              </button>
            ))}
          </div>

          {view === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {shown.map(u => {
                const offer = offerPrice({ offer: u.offer }, u.priceFrom || 0)
                const claim = claimOf(u)
                const size = sizeOf(u)
                const plan = u.floorPlans?.find(f => f.image)?.image
                return (
                  <div key={u.slug} className="rounded-xl overflow-hidden flex flex-col" style={{ border: `${claim ? 2 : 1}px solid ${claim ? '#10B981' : liveOffer(u) ? 'rgba(203,1,1,0.35)' : 'var(--border)'}`, background: claim ? 'rgba(16,185,129,0.04)' : 'var(--surface)', boxShadow: claim ? '0 4px 18px rgba(16,185,129,0.15)' : undefined }}>
                    <Link href={`/projects/${u.slug}`} className="relative h-36 block" style={{ background: 'var(--bg-alt)' }}>
                      {(plan || u.coverImage) && <Image src={plan || u.coverImage!} alt={`${name} ${bedsLabel(bedsOf(u))} ${typeLabel(u.type)}${plan ? ' floor plan' : ''}`} fill className={plan ? 'object-contain p-2' : 'object-cover'} sizes="(max-width:640px)100vw,33vw" />}
                      <span className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {liveOffer(u) && <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#CB0101' }}><Sparkles size={10} /> {offerTitle(liveOffer(u)!, 'Offer')}</span>}
                        {claim && <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#047857' }}><Flame size={10} /> {Math.round(claim.pct * 10) / 10}% Below Market</span>}
                        {plan && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white" style={{ color: '#0F172A' }}>Floor plan</span>}
                      </span>
                      {u.status === 'sold_out' && <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#64748B' }}>Sold out</span>}
                    </Link>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Link href={`/projects/${u.slug}`} className="text-sm font-bold hover:underline" style={{ color: 'var(--text)' }}>{bedsLabel(bedsOf(u))} {typeLabel(u.type)}</Link>
                        <div className="text-right">
                          {offer ? <p className="text-[11px] line-through" style={{ color: 'var(--text-muted)' }}>{formatPrice(u.priceFrom!)}</p>
                            : claim && <p className="text-[11px] line-through" style={{ color: 'var(--text-muted)' }} title="Market reference for this unit">{formatPrice(claim.reference)}</p>}
                          <p className="text-sm font-bold" style={{ color: 'var(--teal)' }}>{priceOf(u) ? formatPrice(priceOf(u)) : 'On request'}</p>
                        </div>
                      </div>
                      <OpportunityBadges opportunity={u.opportunity} kind="project" className="mb-2" />
                      <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs mb-3" style={{ color: 'var(--text-mid)' }}>
                        {u.bedrooms && <span className="flex items-center gap-1"><BedDouble size={12} style={{ color: 'var(--teal)' }} />{/[a-z]/i.test(u.bedrooms) ? u.bedrooms : `${u.bedrooms} Bed`}</span>}
                        {u.bathrooms && <span className="flex items-center gap-1"><Bath size={12} style={{ color: 'var(--teal)' }} />{/[a-z]/i.test(u.bathrooms) ? u.bathrooms : `${u.bathrooms} Bath`}</span>}
                        {size > 0 && <span className="flex items-center gap-1"><Maximize2 size={12} style={{ color: 'var(--teal)' }} />{size.toLocaleString()} sq ft</span>}
                        {u.handover && <span className="flex items-center gap-1"><CalendarClock size={12} style={{ color: 'var(--teal)' }} />{u.handover}</span>}
                        {u.paymentPlan && <span className="flex items-center gap-1"><Wallet size={12} style={{ color: 'var(--teal)' }} />{u.paymentPlan}</span>}
                      </div>
                      {liveOffer(u) && <OfferGifts item={u} max={3} className="mb-2" />}
                      {size > 0 && priceOf(u) > 0 && <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>AED {Math.round(priceOf(u) / size).toLocaleString()} / sq ft</p>}
                      <div className="flex gap-2 mt-auto">
                        <button type="button" onClick={() => enquireUnit(u)} className="btn-primary btn-sm flex-1 gap-1"><MessageCircleHeart size={12} /> Enquire</button>
                        <Link href={`/projects/${u.slug}`} className="btn-outline btn-sm flex-1 justify-center">Details</Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr style={{ color: 'var(--text-muted)' }}>
                    {['Unit', 'Bedrooms', 'Bathrooms', 'Size', 'Price', 'Deal', 'AED / sq ft', 'Handover', 'Payment plan', ''].map(h => <th key={h} className="text-left text-[11px] uppercase tracking-wide font-semibold px-3 py-2">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {shown.map(u => {
                    const size = sizeOf(u), price = priceOf(u), claim = claimOf(u), o = liveOffer(u), op = offerPrice(u, u.priceFrom || 0)
                    return (
                      <tr key={u.slug} style={{ borderTop: '1px solid var(--border-soft)', background: claim ? 'rgba(16,185,129,0.06)' : undefined, boxShadow: claim ? 'inset 3px 0 0 #10B981' : undefined }}>
                        <td className="px-3 py-2.5 font-semibold"><Link href={`/projects/${u.slug}`} className="hover:underline" style={{ color: 'var(--text)' }}>{typeLabel(u.type)}</Link></td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--text-mid)' }}>{bedsLabel(bedsOf(u))}</td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--text-mid)' }}>{u.bathrooms || '—'}</td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--text-mid)' }}>{size ? `${size.toLocaleString()} sq ft` : '—'}</td>
                        <td className="px-3 py-2.5 font-bold" style={{ color: 'var(--teal)' }}>{price ? formatPrice(price) : '—'}{op && <s className="block text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>{formatPrice(u.priceFrom!)}</s>}</td>
                        <td className="px-3 py-2.5 text-[11px] font-bold">
                          {o && <span className="block" style={{ color: '#CB0101' }}>{offerTitle(o, 'Offer')}</span>}
                          {claim && <span className="block" style={{ color: '#047857' }}>{Math.round(claim.pct * 10) / 10}% below market</span>}
                          {!o && !claim && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--text-mid)' }}>{size && price ? Math.round(price / size).toLocaleString() : '—'}</td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--text-mid)' }}>{u.handover || '—'}</td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--text-mid)' }}>{u.paymentPlan || '—'}</td>
                        <td className="px-3 py-2.5 text-right"><button type="button" onClick={() => enquireUnit(u)} className="btn-outline btn-sm">Enquire</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {shown.length === 0 && <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>No unit matches these filters.</p>}
        </div>

        {/* ── About + amenities ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card p-6 lg:col-span-2">
            <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>About {name}</h2>
            {p.description
              ? <div className="prose-content text-sm leading-relaxed line-clamp-[12]" style={{ color: 'var(--text-mid)' }} dangerouslySetInnerHTML={{ __html: p.description }} />
              : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Details coming soon.</p>}
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
              <Link href={`/projects/${g.canonicalSlug}`} className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--teal)' }}><Building2 size={14} /> Full project page &amp; nearby places</Link>
              <Link href={mapHref} className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--teal)' }}><MapIcon size={14} /> View location on our map</Link>
            </div>
          </div>
          {amenities.length > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>{name} amenities</h2>
              <div className="flex flex-wrap gap-2">
                {amenities.slice(0, 24).map(a => (
                  <span key={a.k} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs" style={{ border: '1px solid var(--border)', color: 'var(--text-mid)' }}><a.icon size={12} style={{ color: 'var(--teal)' }} />{a.label}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <Link href={`/projects/${slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold mt-6" style={{ color: 'var(--text-mid)' }}><ArrowLeft size={14} /> Back to the unit</Link>
      </div>
      <Footer />

      {lightbox !== null && <ImageLightbox images={g.gallery} start={lightbox} title={name} onClose={() => setLightbox(null)} />}
      <ProjectInterestModal projectId={enquire?.id || p._id} projectTitle={enquire?.title || name} open={!!enquire} onClose={() => setEnquire(null)} />
    </div>
  )
}
