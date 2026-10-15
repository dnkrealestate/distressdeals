'use client'
import { Info } from 'lucide-react'
import { activeCurrency, useCurrencyStore } from '@/lib/currency'

// Under a converted price: the rate used and the real AED price (the price is set in AED — the conversion is a guide).
export default function CurrencyNote({ aed, className = '' }: { aed?: number; className?: string }) {
  const { ratesDate } = useCurrencyStore()
  const cur = activeCurrency()
  if (cur.code === 'AED') return null
  const rate = cur.rate >= 1 ? cur.rate.toFixed(2) : cur.rate.toFixed(4)
  return (
    <p className={`flex items-start gap-1 text-[11px] leading-snug ${className}`} style={{ color: 'var(--text-muted)' }}>
      <Info size={11} className="mt-0.5 flex-shrink-0" />
      <span>
        Shown in {cur.code} at today&apos;s rate (1 AED = {rate} {cur.code}{ratesDate ? `, ${ratesDate}` : ''}).
        {aed ? <> Price set in AED: <b>AED {aed.toLocaleString('en-US')}</b>.</> : ' Prices are set in AED.'}
      </span>
    </p>
  )
}
