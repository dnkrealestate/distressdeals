import { formatPrice } from '@/lib/utils'
import type { Opportunity } from '@/types'

// Under a "market value" field in the admin forms: what the price works out to against it, as the visitor will see it.
export function MarketValueHint({ price, marketValue }: { price: number; marketValue: number }) {
  if (!(marketValue > 0)) return <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>When set, the card shows "x% Below Market". Empty = nothing is claimed.</p>
  if (!(price > 0)) return null
  const pct = ((marketValue - price) / marketValue) * 100
  if (pct <= 0) return <p className="text-[11px] mt-1" style={{ color: '#B45309' }}>The price is not below this value — no "below market" badge will show.</p>
  if (pct > 60) return <p className="text-[11px] mt-1" style={{ color: '#B45309' }}>That is {pct.toFixed(0)}% below — too large to be shown. Please check the figure.</p>
  return <p className="text-[11px] mt-1 font-medium" style={{ color: '#047857' }}>{pct.toFixed(1)}% below market · potential advantage {formatPrice(Math.round(marketValue - price))}</p>
}

// New projects: the two automatic figures of the "Pricing Opportunity" block — read-only, always worked out from the
// comparable market price and our deal price — plus the checks a reviewer should not miss.
export function PricingOpportunityCalc({ dealPrice, reference, source }: { dealPrice: number; reference: number; source: string }) {
  const has = reference > 0 && dealPrice > 0
  const pct = has ? ((reference - dealPrice) / reference) * 100 : 0
  const valid = has && pct > 0 && pct <= 60
  const box = (label: string, value: string) => (
    <div className="rounded-lg px-3 py-2.5" style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}>
      <p className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>{label} <span className="font-normal">· automatic</span></p>
      <p className="text-sm font-bold mt-0.5" style={{ color: valid ? '#047857' : 'var(--text-muted)' }}>{value}</p>
    </div>
  )
  const warn = (t: string) => <p className="text-[11px]" style={{ color: '#B45309' }}>{t}</p>
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {box('Potential Advantage', valid ? formatPrice(Math.round(reference - dealPrice)) : '—')}
        {box('Below Market', valid ? `${pct.toFixed(1)}%` : '—')}
      </div>
      {!(reference > 0) && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>No comparable market price entered — the project shows its normal price and no "below market" claim.</p>}
      {has && pct <= 0 && warn('The deal price is not below the comparable market price — no "below market" claim will be shown.')}
      {has && pct > 60 && warn(`That is ${pct.toFixed(0)}% below — too large to be shown. Please check both prices.`)}
      {valid && pct > 30 && warn(`${pct.toFixed(0)}% is an unusually large difference. Please double-check both prices before saving.`)}
      {valid && !source.trim() && warn('Add where the comparable market price comes from (Market Price Source / Evidence) so the claim can be backed up.')}
    </div>
  )
}

const FACTOR_LABEL: Record<string, string> = {
  advantage: 'Price advantage', distress: 'Distress / urgency', reduction: 'Price reduction', verification: 'Verification',
  freshness: 'Freshness', quality: 'Data quality', incentives: 'Developer incentives', paymentPlan: 'Payment plan',
  location: 'Location', investment: 'Investment potential',
}

// The current Opportunity Score and what it is made of — so staff can see why a record ranks where it does.
export function OpportunitySummary({ opportunity: o, project = false }: { opportunity: Opportunity; project?: boolean }) {
  if (project) return (
    <div className="rounded-lg p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Summary <span className="font-normal" style={{ color: 'var(--text-muted)' }}>· as last calculated</span></p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        <p>Reference price<br /><b style={{ color: 'var(--text)' }}>{o.belowMarketPct ? formatPrice(o.referenceValue || 0) : '—'}</b></p>
        <p>Our deal price{o.unit ? ` (${o.unit})` : ''}<br /><b style={{ color: 'var(--text)' }}>{o.belowMarketPct ? formatPrice(o.dealPrice || 0) : '—'}</b></p>
        <p>Potential advantage<br /><b style={{ color: 'var(--text)' }}>{o.belowMarketPct ? formatPrice(o.advantage || 0) : '—'}</b></p>
        <p>Below market<br /><b style={{ color: 'var(--text)' }}>{o.belowMarketPct ? `${o.belowMarketPct}%` : 'no claim'}</b></p>
        <p>Opportunity Score<br /><b className="grad-text">{o.score} / 100{o.best ? ' · Best Opportunity' : ''}</b></p>
      </div>
      {o.factors && (
        <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
          {Object.entries(o.factors).map(([k, v]) => `${FACTOR_LABEL[k] || k} ${v}`).join(' · ')}{o.rentalYield ? ` · rental yield ${o.rentalYield}%` : ''}
        </p>
      )}
      <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Recalculated a few seconds after every save, and hourly. Best Opportunity needs a score of 70+ and a documented below-market price.</p>
    </div>
  )
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
        Current Opportunity Score: <span className="grad-text">{o.score} / 100</span>
        {o.best ? ' · Best Opportunity' : ''}
        {o.belowMarketPct ? ` · ${o.belowMarketPct}% below market (${o.basis === 'valuation' ? 'your market value' : o.basis === 'transactions' ? `${o.comps} registered sales` : `${o.comps} comparable listings`})` : ' · no below-market figure'}
      </p>
      {o.factors && (
        <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
          {Object.entries(o.factors).map(([k, v]) => `${FACTOR_LABEL[k] || k} ${v}`).join(' · ')}
        </p>
      )}
      <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Recalculated a few seconds after every save, and hourly.</p>
    </div>
  )
}
