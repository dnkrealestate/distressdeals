import { create } from 'zustand'

// Showing prices in the visitor's currency. Every price is set in AED; on public pages it is converted for display at
// the day's market rate (backend services/currencyService.ts — refreshed daily). The AED price stays the real price.
//
// `formatPrice` (lib/utils) reads the active currency below, so every price on the page converts without touching each
// call. It stays AED during the server render and the first browser render (so the two match); CurrencyProvider then
// switches it and re-renders the page. Admin and seller dashboards always show AED.

export interface DisplayCurrency { code: string; rate: number }
let active: DisplayCurrency = { code: 'AED', rate: 1 }
export const activeCurrency = () => active
export const setActiveCurrency = (c: DisplayCurrency) => { active = c }

/** An exact AED amount (price per sq ft and the like) in the active currency, unabbreviated: "INR 55,870". */
export function exactPrice(aed: number): string {
  const c = activeCurrency()
  return `${c.code} ${Math.round(aed * c.rate).toLocaleString(c.code === 'INR' || c.code === 'PKR' ? 'en-IN' : 'en-US')}`
}

// The ones offered first in the menu (GCC, the biggest buyer markets, majors).
export const POPULAR = ['AED', 'USD', 'EUR', 'GBP', 'INR', 'PKR', 'SAR', 'QAR', 'KWD', 'OMR', 'BHD', 'RUB', 'CNY', 'CAD', 'AUD', 'CHF', 'EGP', 'TRY', 'KZT', 'NGN', 'ZAR', 'SGD', 'HKD', 'JPY']

const names = (() => { try { const d = new Intl.DisplayNames(['en'], { type: 'currency' }); return (c: string) => d.of(c) || c } catch { return (c: string) => c } })()
export const currencyName = (code: string) => names(code)

/** "INR 3.99 Cr", "USD 419K", "EUR 1.2M" — a converted amount in the site's short style. */
export function formatMoney(amount: number, code: string): string {
  if (!Number.isFinite(amount)) return '—'
  // Indian / Pakistani buyers count in lakh and crore.
  if (code === 'INR' || code === 'PKR' || code === 'NPR' || code === 'BDT') {
    if (amount >= 1e7) return `${code} ${trim(amount / 1e7, 2)} Cr`
    if (amount >= 1e5) return `${code} ${trim(amount / 1e5, 2)} L`
    return `${code} ${Math.round(amount).toLocaleString('en-IN')}`
  }
  if (amount >= 1e9) return `${code} ${trim(amount / 1e9, 2)}B`
  if (amount >= 1e6) return `${code} ${trim(amount / 1e6, 2)}M`
  if (amount >= 1e3) return `${code} ${trim(amount / 1e3, amount >= 1e5 ? 0 : 1)}K`
  return `${code} ${amount.toLocaleString('en-US', { maximumFractionDigits: amount < 10 ? 2 : 0 })}`
}
const trim = (n: number, d: number) => String(Number(n.toFixed(d)))

// ── Price filters in the visitor's currency ──
// Preset ranges are kept in AED (that is what listings are priced in); shown in another currency they become round local
// amounts ("INR 13 L – 26 L"), and the AED values behind them are worked out from those, so the label is exact.
const niceRound = (n: number) => { if (n <= 0) return 0; const p = 10 ** (Math.floor(Math.log10(n)) - 1); return Math.round(n / p) * p }
const amountOnly = (n: number, code: string) => formatMoney(n, code).slice(code.length + 1)

export interface PriceBucket { min: number; max: number; label: string; lMin: number; lMax: number }
/** AED preset ranges ({min,max}, 0 = open) as the visitor sees them: labels in their currency, AED values to search by. */
export function priceBuckets(list: { min: number; max: number }[], anyLabel = 'Any price'): PriceBucket[] {
  const c = activeCurrency()
  return list.map(({ min, max }) => {
    if (!min && !max) return { min: 0, max: 0, label: anyLabel, lMin: 0, lMax: 0 }
    const lMin = c.code === 'AED' ? min : niceRound(min * c.rate)
    const lMax = c.code === 'AED' ? max : niceRound(max * c.rate)
    const aMin = c.code === 'AED' ? min : Math.round(lMin / c.rate)
    const aMax = c.code === 'AED' ? max : Math.round(lMax / c.rate)
    const label = !lMin ? `Under ${formatMoney(lMax, c.code)}` : !lMax ? `${formatMoney(lMin, c.code)}+` : `${c.code} ${amountOnly(lMin, c.code)} – ${amountOnly(lMax, c.code)}`
    return { min: aMin, max: aMax, label, lMin, lMax }
  })
}
/** The same range (AED values; small rounding differences ignored). */
export const sameRange = (aMin = 0, aMax = 0, bMin = 0, bMax = 0) => {
  const near = (x: number, y: number) => (!x && !y) || (!!x && !!y && Math.abs(x - y) / Math.max(x, y) < 0.02)
  return near(aMin, bMin) && near(aMax, bMax)
}
/** A typed amount in the visitor's currency → AED (and back), for price boxes. */
export const toAed = (local: number) => { const c = activeCurrency(); return c.code === 'AED' ? local : Math.round(local / c.rate) }
export const fromAed = (aed: number) => {
  const c = activeCurrency()
  if (c.code === 'AED') return aed
  const n = aed * c.rate, p = n >= 1000 ? 10 ** (Math.floor(Math.log10(n)) - 2) : 1
  return Math.round(n / p) * p
}
/** "1 AED = 25.94 INR" — or '' when prices are in AED. */
export function rateText(): string {
  const c = activeCurrency()
  if (c.code === 'AED') return ''
  return `1 AED = ${c.rate >= 100 ? c.rate.toFixed(0) : c.rate >= 1 ? c.rate.toFixed(2) : c.rate.toFixed(4)} ${c.code}`
}

// ── State the menu and the note read ──
const KEY = 'dd_currency_v1'
interface Saved { code: string; manual: boolean }
export const loadSaved = (): Saved | null => { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v?.code ? v : null } catch { return null } }
export const saveChoice = (s: Saved) => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* private mode */ } }

interface CurrencyState {
  code: string                         // chosen currency (manual or detected)
  rates: Record<string, number> | null // AED → x
  ratesDate?: string
  source?: string
  ready: boolean                       // rates and choice known
  set: (p: Partial<Omit<CurrencyState, 'set'>>) => void
}
export const useCurrencyStore = create<CurrencyState>(set => ({ code: 'AED', rates: null, ready: false, set: p => set(p) }))

/** Choose a currency from the menu (remembered on this device). */
export function chooseCurrency(code: string) {
  saveChoice({ code, manual: true })
  useCurrencyStore.getState().set({ code })
}
