import { Timer, Sparkles, Gift, CalendarRange, FileCheck2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { liveOffer, offerEnds, offerPrice, offerPerks, offerSavingPct, offerTitle, discountOf } from '@/lib/offer'
import type { Offer } from '@/types'

// The pieces a card or a detail page shows while a limited-time offer is live. Every one renders nothing without a
// live offer, so listings without offers look exactly as they always did.
type WithOffer = { offer?: Offer | null }

// On the picture: "Limited Offer · 5 days left".
export function OfferRibbon({ item }: { item: WithOffer }) {
  const o = liveOffer(item)
  if (!o) return null
  const ends = offerEnds(o)
  return (
    <div className="absolute bottom-0 inset-x-0 z-10 flex items-center justify-between gap-2 px-3 py-1.5 pointer-events-none"
      style={{ background: 'linear-gradient(90deg, #CB0101, #FD7147 70%, #F59E0B)' }}>
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-white truncate"><Sparkles size={12} /> {offerTitle(o)}</span>
      {ends && <span className="flex items-center gap-1 text-[11px] font-semibold text-white whitespace-nowrap" suppressHydrationWarning><Timer size={11} /> {ends}</span>}
    </div>
  )
}

// What comes with the offer — the payment-plan offer, the DLD waiver and the gifts — as small gold chips.
export function OfferGifts({ item, className = '', max = 3, giftsOnly = false }: { item: WithOffer; className?: string; max?: number; giftsOnly?: boolean }) {
  const perks = offerPerks(liveOffer(item)).filter(p => !giftsOnly || p.key.startsWith('gift-'))
  if (!perks.length) return null
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {perks.slice(0, max).map(({ key, label, icon: Icon, title }) => (
        <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" title={title}
          style={{ color: '#92400E', background: 'linear-gradient(135deg, rgba(251,191,36,0.28), rgba(245,158,11,0.14))', border: '1px solid rgba(245,158,11,0.45)' }}>
          <Icon size={11} /> {label}
        </span>
      ))}
      {perks.length > max && <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>+{perks.length - max} more</span>}
    </div>
  )
}

// The price on a detail page: the offer price while a priced offer is live, with the normal price struck through
// beside it; otherwise simply the normal price. `className` styles the price itself.
// The normal price is never replaced: it stays where it is, under its own label, and is only crossed out while a
// priced offer is live — with the offer price on its own line beneath it.
export function PriceInForce({ item, normalPrice, className = 'text-3xl font-bold grad-text', suffix, center = false }: { item: WithOffer; normalPrice: number; className?: string; suffix?: React.ReactNode; center?: boolean }) {
  const price = offerPrice(item, normalPrice)
  if (!price) return <p className={className}>{formatPrice(normalPrice)}{suffix}</p>
  return (
    <>
      <p className="text-2xl font-bold line-through decoration-2" style={{ color: 'var(--text-muted)', textDecorationColor: '#CB0101' }} title="Normal price — replaced by the offer price while the offer runs">{formatPrice(normalPrice)}{suffix}</p>
      <p className="text-[11px] font-bold uppercase tracking-wider mt-2" style={{ color: '#CB0101' }}>Offer Price</p>
      <p className={`flex items-baseline gap-2 flex-wrap ${center ? 'justify-center' : ''}`}>
        <span className={className}>{formatPrice(price)}{suffix}</span>
        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ background: '#CB0101' }}>-{offerSavingPct(normalPrice, price)}%</span>
      </p>
    </>
  )
}

// The price while an offer with its own price is live: the offer price, the normal price struck through, "-12%".
// Returns null when there is no priced offer — the caller then shows its normal price block.
// The normal price keeps its own name and figure — it is only crossed out — and the offer price is shown with it.
export function OfferPriceTag({ item, normalPrice, size = 'text-xl', suffix, normalLabel = 'Price' }: { item: WithOffer; normalPrice: number; size?: string; suffix?: React.ReactNode; normalLabel?: string }) {
  const price = offerPrice(item, normalPrice)
  if (!price) return null
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{normalLabel} <s className="font-bold normal-case" style={{ color: 'var(--text-mid)' }}>{formatPrice(normalPrice)}</s></p>
      <p className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#CB0101' }}>Offer</span>
        <span className={`${size} font-bold grad-text leading-tight`}>{formatPrice(price)}{suffix}</span>
        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ background: '#CB0101' }}>-{offerSavingPct(normalPrice, price)}%</span>
      </p>
    </div>
  )
}

// On a developer's page: the offer that applies to all of that developer's projects.
export function DeveloperOfferBanner({ offer, name, className = '' }: { offer?: Offer | null; name: string; className?: string }) {
  const o = liveOffer({ offer })
  if (!o) return null
  const ends = offerEnds(o), pct = discountOf(o)
  return (
    <div className={`rounded-2xl p-[1.5px] ${className}`} style={{ background: 'linear-gradient(120deg, #CB0101, #FD7147, #F59E0B)' }}>
      <div className="rounded-[14px] p-5 flex flex-wrap items-center gap-x-6 gap-y-3" style={{ background: 'var(--surface)' }}>
        {pct > 0 && <p className="text-4xl font-extrabold grad-text leading-none">{pct}%<span className="text-base font-bold ml-1">OFF</span></p>}
        <div className="flex-1 min-w-[220px]">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color: '#CB0101' }}><Sparkles size={15} /> {offerTitle(o, 'Limited-Time Offer')}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-mid)' }}>{pct > 0 ? `${pct}% off every project by ${name}` : `On every project by ${name}`} — the offer price is shown on each project below.</p>
          <OfferGifts item={{ offer: o }} max={8} className="mt-2.5" />
          {o.note && <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{o.note}</p>}
        </div>
        {(ends || o.endsAt) && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white" style={{ background: '#CB0101' }} suppressHydrationWarning>
            <Timer size={12} /> {ends}{o.endsAt ? ` · until ${new Date(o.endsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
          </span>
        )}
      </div>
    </div>
  )
}

// The banner on a detail page: what the offer is, until when, and what comes with it.
export function OfferBanner({ item, normalPrice, className = '' }: { item: WithOffer; normalPrice: number; className?: string }) {
  const o = liveOffer(item)
  if (!o) return null
  const price = offerPrice(item, normalPrice), ends = offerEnds(o)
  return (
    <div className={`rounded-2xl p-[1.5px] ${className}`} style={{ background: 'linear-gradient(120deg, #CB0101, #FD7147, #F59E0B)' }}>
      <div className="rounded-[14px] p-5" style={{ background: 'var(--surface)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color: '#CB0101' }}><Sparkles size={15} /> {offerTitle(o, 'Limited-Time Offer')}</p>
          {(ends || o.endsAt) && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white" style={{ background: '#CB0101' }} suppressHydrationWarning>
              <Timer size={12} /> {ends}{o.endsAt ? ` · until ${new Date(o.endsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
            </span>
          )}
        </div>
        {o.fromDeveloper && <p className="text-xs mt-1.5" style={{ color: 'var(--text-mid)' }}>A developer offer — it applies to every project of this developer.</p>}
        {price && (
          <p className="flex items-baseline gap-3 flex-wrap mt-3">
            <span className="text-3xl font-bold grad-text">{formatPrice(price)}</span>
            <s className="text-sm" style={{ color: 'var(--text-muted)' }}>{formatPrice(normalPrice)}</s>
            <span className="text-xs font-bold" style={{ color: '#047857' }}>Save {formatPrice(normalPrice - price)} ({offerSavingPct(normalPrice, price)}%)</span>
          </p>
        )}
        {(o.paymentPlan || o.dldWaiver) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {o.paymentPlan && (
              <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                <CalendarRange size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#CB0101' }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Offer payment plan<br /><b className="text-sm" style={{ color: 'var(--text)' }}>{o.paymentPlan}</b></p>
              </div>
            )}
            {o.dldWaiver && (
              <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                <FileCheck2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#CB0101' }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>DLD fee offer<br /><b className="text-sm" style={{ color: 'var(--text)' }}>{o.dldWaiver}</b></p>
              </div>
            )}
          </div>
        )}
        {(o.gifts?.length || 0) > 0 && (
          <div className="mt-4 rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.22), rgba(245,158,11,0.08))', border: '1px solid rgba(245,158,11,0.5)' }}>
            <p className="flex items-center gap-2 text-sm font-bold mb-3" style={{ color: '#92400E' }}><Gift size={16} /> Included with this offer</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {offerPerks(o).filter(p => p.key.startsWith('gift-')).map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: 'var(--surface)', border: '1px solid rgba(245,158,11,0.45)', boxShadow: '0 4px 14px -8px rgba(245,158,11,0.7)' }}>
                  <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}><Icon size={17} /></span>
                  <span className="text-sm font-bold leading-snug" style={{ color: 'var(--text)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {o.note && <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>{o.note}</p>}
        <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>Offer subject to availability and to the terms of the developer / owner. Ask our team for the full conditions.</p>
      </div>
    </div>
  )
}
