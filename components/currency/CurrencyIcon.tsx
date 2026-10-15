'use client'
import DirhamIcon from '@/components/shared/DirhamIcon'
import { activeCurrency } from '@/lib/currency'

// The money icon next to price filters: the Dirham sign for AED, the currency's own symbol otherwise (₹, $, €, £…),
// or its code when it has no symbol of its own. Same props as the icons it replaces.
const symbolOf = (code: string) => {
  try {
    const s = new Intl.NumberFormat('en', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' }).formatToParts(0).find(p => p.type === 'currency')?.value
    return s && s !== code ? s : code
  } catch { return code }
}

export default function CurrencyIcon({ size = 14, style, className = '' }: { size?: number; style?: React.CSSProperties; className?: string }) {
  const code = activeCurrency().code
  if (code === 'AED') return <DirhamIcon size={size} style={style} className={className} />
  const sym = symbolOf(code)
  const isCode = sym.length > 2
  return (
    <span aria-hidden className={`inline-flex items-center justify-center font-bold leading-none ${className}`}
      style={{ fontSize: isCode ? Math.max(8, size * 0.62) : size * 0.95, minWidth: size, height: size, ...style }}>
      {sym}
    </span>
  )
}
