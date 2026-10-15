'use client'
import { rateText, useCurrencyStore } from '@/lib/currency'

// The tiny "1 AED = 25.94 INR · today" line (nothing when prices are in AED).
export default function RateLine({ className = '', light = false }: { className?: string; light?: boolean }) {
  const { ratesDate } = useCurrencyStore()
  const t = rateText()
  if (!t) return null
  const day = ratesDate ? new Date(ratesDate + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : 'today'
  return (
    <span className={`block text-[10px] leading-tight ${className}`} style={{ color: light ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }} title="Prices are set in AED and converted at the day's market rate">
      {t} · {day}
    </span>
  )
}
