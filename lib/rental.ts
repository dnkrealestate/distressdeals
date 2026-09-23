import type { RentalStatus } from '@/types'

// Rent availability — the rent-side counterpart to a sale listing's Ready / Off-Plan status.

export const RENTAL_STATUS_OPTIONS: { v: RentalStatus; l: string; hint: string }[] = [
  { v: 'available_now',  l: 'Available now',      hint: 'Vacant — a tenant can move in straight away' },
  { v: 'available_soon', l: 'Available soon',     hint: 'Vacant from a set date' },
  { v: 'occupied',       l: 'Currently rented',   hint: 'A tenant is in place — free again from the lease end date' },
]

// Buyer-side filter chips: what a tenant wants to know is "when can I move in?".
export const AVAILABILITY_FILTERS = [
  { v: '',                l: 'Any' },
  { v: 'available_now',   l: 'Available now' },
  { v: 'available_soon',  l: 'Available soon' },
  { v: 'occupied',        l: 'Currently rented' },
]

// "Move in within…" — maps to the `availableWithin` (days) query param.
export const AVAILABLE_WITHIN = [
  { v: 0,   l: 'Any time' },
  { v: 30,  l: 'Within 30 days' },
  { v: 60,  l: 'Within 60 days' },
  { v: 90,  l: 'Within 3 months' },
  { v: 180, l: 'Within 6 months' },
]

export const isRentalStatus = (v: any): v is RentalStatus =>
  v === 'available_now' || v === 'available_soon' || v === 'occupied'

// A missing status on a rent listing means it predates the field — treat as available now.
export const rentalStatusOf = (p: { listingType?: string; rentalStatus?: string }): RentalStatus | null =>
  p.listingType !== 'rent' ? null : isRentalStatus(p.rentalStatus) ? p.rentalStatus : 'available_now'

export function formatAvailableDate(iso?: string | Date | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// yyyy-mm-dd for <input type="date">
export function toDateInput(iso?: string | Date | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

export const todayInput = () => new Date().toISOString().slice(0, 10)

/** Short label for cards/pins: "Available now", "Available 1 Nov 2026", "Rented · free 1 Nov 2026". */
export function rentalLabel(p: { listingType?: string; rentalStatus?: string; availableFrom?: string | Date | null }): string {
  const s = rentalStatusOf(p)
  if (!s) return ''
  const date = formatAvailableDate(p.availableFrom)
  if (s === 'available_now') return 'Available now'
  if (s === 'available_soon') return date ? `Available ${date}` : 'Available soon'
  return date ? `Rented · free ${date}` : 'Currently rented'
}

// Colours for the small status badge (bg / fg pairs read fine on both light and dark cards).
export const RENTAL_TONE: Record<RentalStatus, { bg: string; fg: string }> = {
  available_now:  { bg: 'rgba(22,163,74,0.14)',  fg: '#16a34a' },
  available_soon: { bg: 'rgba(217,119,6,0.14)',  fg: '#d97706' },
  occupied:       { bg: 'rgba(100,116,139,0.16)', fg: '#64748b' },
}
