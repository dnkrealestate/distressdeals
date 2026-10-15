'use client'
import { formatPrice } from '@/lib/utils'
import { exactPrice, useCurrencyStore } from '@/lib/currency'

// An AED price inside a server-rendered page, shown in the visitor's currency once the browser knows it.
export default function Price({ aed, fallback = '—', exact = false }: { aed?: number | null; fallback?: string; exact?: boolean }) {
  useCurrencyStore(s => s.code)   // re-render when the currency changes
  return <>{aed && aed > 0 ? (exact ? exactPrice(aed) : formatPrice(aed)) : fallback}</>
}
