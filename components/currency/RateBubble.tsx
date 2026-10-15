'use client'
import { usePathname } from 'next/navigation'
import { rateText, useCurrencyStore } from '@/lib/currency'

// A tiny floating pill, bottom-left: "1 AED = 25.94 INR". Only when prices are shown in another currency; it sits above
// the bottom navigation bar where that bar is shown (below 1280px).
export default function RateBubble() {
  const pathname = usePathname() || '/'
  const { ratesDate } = useCurrencyStore()
  const t = rateText()
  if (!t || /^\/(admin|seller|auth)(\/|$)/.test(pathname)) return null
  return (
    <div className="fixed left-3 z-30 pointer-events-none bottom-[calc(76px+env(safe-area-inset-bottom))] xl:bottom-5"
      title={`Prices are set in AED and converted at the day's market rate${ratesDate ? ` (${ratesDate})` : ''}`}>
      <span className="pointer-events-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-md"
        style={{ background: 'color-mix(in srgb, var(--surface) 92%, transparent)', color: 'var(--text-mid)', border: '1px solid var(--border)', backdropFilter: 'blur(8px)' }}>
        <span style={{ color: 'var(--teal)' }}>●</span>{t}
      </span>
    </div>
  )
}
