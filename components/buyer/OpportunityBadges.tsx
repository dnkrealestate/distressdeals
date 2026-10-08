import { Flame, TrendingDown, Zap, Sparkles } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { Opportunity } from '@/types'

// The small opportunity indicators on a listing or project card. Everything here comes from the server-computed
// `opportunity` (backend utils/opportunity.ts): a "below market" figure is shown only when there is a real reference
// behind it — a market value entered by our team, or enough like-for-like comparables — otherwise the card shows its
// normal price and nothing is claimed.
// Shown wherever an automatic, transaction-based reference is used. Never "guaranteed" anything.
export const MARKET_DISCLAIMER = 'Market reference is calculated from recent comparable transactions and is provided for informational purposes.'
const basisNote = (o: Opportunity, kind: 'property' | 'project' = 'property') =>
  o.basis === 'transactions'
    ? `${o.unit ? `${o.unit}: ` : ''}Market reference ${formatPrice(o.referenceValue || 0)}, based on ${o.comps} comparable transactions. ${MARKET_DISCLAIMER}`
    : kind === 'project'
    ? `${o.unit ? `${o.unit}: our` : 'Our'} deal price of ${formatPrice(o.dealPrice || 0)} compared with the comparable market price of ${formatPrice(o.referenceValue || 0)}`
    : o.basis === 'valuation'
      ? `Compared with the estimated market value of ${formatPrice(o.referenceValue || 0)}`
      : `Compared with ${o.comps || 'several'} similar properties in the same area (same type, bedrooms and size)`

// A project's deal price against its documented reference price, for the price block of a card or the project page.
// Returns nothing unless the server computed a real saving — and, for a project-level figure, only while it still
// belongs to the price on screen (a price edited a moment ago shows no struck-through figure until it is recalculated).
export function dealClaim(p: { priceFrom: number; opportunity?: Opportunity | null; offer?: any }) {
  const o = p.opportunity
  if (!o?.belowMarketPct || !o.referenceValue || !o.dealPrice || o.referenceValue <= o.dealPrice) return null
  if (!o.unit && o.dealPrice !== p.priceFrom && o.dealPrice !== Number(p.offer?.price)) return null
  return { reference: o.referenceValue, dealPrice: o.dealPrice, unit: o.unit, pct: o.belowMarketPct, advantage: o.advantage || 0 }
}

// The small print under a price on a detail page — only when the figure comes from registered sales.
export function MarketDisclaimer({ opportunity: o, className = '' }: { opportunity?: Opportunity | null; className?: string }) {
  if (!o?.belowMarketPct || o.basis !== 'transactions') return null
  return <p className={`text-[10px] leading-snug ${className}`} style={{ color: 'var(--text-muted)' }}>{MARKET_DISCLAIMER}</p>
}

// The struck-through reference price (project-level), or the one unit the saving applies to.
export function DealReference({ project, className = '' }: { project: { priceFrom: number; opportunity?: Opportunity | null; offer?: any }; className?: string }) {
  const c = dealClaim(project)
  if (!c) return null
  return c.unit ? (
    <p className={`text-[11px] ${className}`} style={{ color: 'var(--text-muted)' }}>
      {c.unit}: <span className="font-semibold" style={{ color: 'var(--text-mid)' }}>{formatPrice(c.dealPrice)}</span> <s>{formatPrice(c.reference)}</s>
    </p>
  ) : (
    <p className={`text-xs ${className}`} style={{ color: 'var(--text-muted)' }} title="Comparable market price for the same unit"><s>{formatPrice(c.reference)}</s></p>
  )
}

const pill = (fg: string, bg: string) => ({ color: fg, background: bg, border: `1px solid ${fg}33` })

export function OpportunityBadges({ opportunity: o, kind, className = '' }: { opportunity?: Opportunity | null; kind: 'property' | 'project'; className?: string }) {
  if (!o) return null
  const labels = o.labels || []
  const below = o.belowMarketPct ? Math.round(o.belowMarketPct * 10) / 10 : 0
  // A seller listing is "distressed" / "motivated"; a project is never called distressed — it is a launch opportunity.
  const second = kind === 'property'
    ? (labels.includes('motivated-seller') ? { icon: Zap, text: 'Motivated Seller', fg: '#B45309', bg: 'rgba(245,158,11,0.12)', title: 'The owner wants to complete the sale soon' }
      : labels.includes('price-reduced') ? { icon: TrendingDown, text: 'Price Reduced', fg: '#047857', bg: 'rgba(16,185,129,0.12)', title: 'The asking price has been lowered' } : null)
    : (labels.includes('launch-opportunity') ? { icon: Sparkles, text: 'Launch Opportunity', fg: '#7C3AED', bg: 'rgba(139,92,246,0.12)', title: 'Launch-phase project with a developer incentive or an easy payment plan' } : null)
  if (!o.best && !below && !second) return null

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {o.best && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide" style={pill('#CB0101', 'rgba(203,1,1,0.09)')}
          title="One of the strongest opportunities on the site right now">
          <Flame size={10} /> Best Opportunity
        </span>
      )}
      {below > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={pill('#047857', 'rgba(16,185,129,0.12)')} title={basisNote(o, kind)}>
          <TrendingDown size={10} /> {below}% Below Market
        </span>
      )}
      {below > 0 && (o.advantage || 0) > 0 && (
        <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }} title={basisNote(o, kind)}>
          {kind === 'property' && o.basis !== 'comparables' ? `Market reference ${formatPrice(o.referenceValue || 0)} · ` : ''}Potential advantage {formatPrice(o.advantage!)}
          {o.basis === 'transactions' && o.comps ? ` · Based on ${o.comps} comparable transactions` : ''}
        </span>
      )}
      {second && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={pill(second.fg, second.bg)} title={second.title}>
          <second.icon size={10} /> {second.text}
        </span>
      )}
    </div>
  )
}
