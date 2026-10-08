import { CalendarRange, Car, BadgeCheck, Gem, Sofa, Refrigerator, Receipt, FileCheck2, Banknote, Plane, Gift, type LucideIcon } from 'lucide-react'
import type { Offer, GiftKind } from '@/types'

// Limited-time offers on listings and projects (backend models/offerSchema.ts). One place decides whether an offer is
// running, so cards, the home page and the detail pages always agree.

export const GIFTS: Record<GiftKind, { label: string; icon: LucideIcon }> = {
  car:             { label: 'Car',                  icon: Car },
  golden_visa:     { label: 'Golden Visa',          icon: BadgeCheck },
  gold:            { label: 'Gold',                 icon: Gem },
  furniture:       { label: 'Furniture package',    icon: Sofa },
  appliances:      { label: 'Appliances',           icon: Refrigerator },
  service_charges: { label: 'Free service charges', icon: Receipt },
  dld_waiver:      { label: 'DLD fee waiver',       icon: FileCheck2 },
  cashback:        { label: 'Cashback',             icon: Banknote },
  holiday:         { label: 'Holiday package',      icon: Plane },
  other:           { label: 'Gift',                 icon: Gift },
}
export const GIFT_KINDS = Object.keys(GIFTS) as GiftKind[]

// A usable discount percentage (0 when there is none).
export const discountOf = (o?: Offer | null) => { const n = Number(o?.discountPercent); return Number.isFinite(n) && n > 0 && n <= 90 ? n : 0 }
// What to call the offer when it has no title of its own.
export const offerTitle = (o: Offer, fallback = 'Limited Offer') => o.title || (discountOf(o) && !(Number(o.price) > 0) ? `${discountOf(o)}% Off` : fallback)

// The offer if it is running right now (switched on, inside its period, and offering a price or a gift), else null.
export function liveOffer(item: { offer?: Offer | null } | null | undefined, now = new Date()): Offer | null {
  const o = item?.offer
  if (!o?.enabled) return null
  if (o.startsAt && new Date(o.startsAt) > now) return null
  if (o.endsAt && new Date(o.endsAt) < now) return null
  return Number(o.price) > 0 || discountOf(o) > 0 || (o.gifts?.length || 0) > 0 || !!o.paymentPlan?.trim() || !!o.dldWaiver?.trim() ? o : null
}
// Everything the offer adds besides a price — the payment-plan offer and the DLD waiver first, then the gifts — as
// one list of chips.
export function offerPerks(o: Offer | null): { key: string; label: string; icon: LucideIcon; title: string }[] {
  if (!o) return []
  return [
    ...(o.paymentPlan?.trim() ? [{ key: 'plan', label: o.paymentPlan.trim(), icon: CalendarRange, title: `Offer payment plan: ${o.paymentPlan.trim()}` }] : []),
    ...(o.dldWaiver?.trim() ? [{ key: 'dld', label: o.dldWaiver.trim(), icon: FileCheck2, title: `DLD fee offer: ${o.dldWaiver.trim()}` }] : []),
    ...(o.gifts || []).map(g => ({ key: `gift-${g.label}`, label: g.label, icon: (GIFTS[g.kind] || GIFTS.other).icon, title: `Included with this offer: ${g.label}` })),
  ]
}
// The offer price when a priced offer is live and really below the normal price; otherwise null.
export function offerPrice(item: { offer?: Offer | null }, normalPrice: number): number | null {
  // A fixed offer price, or the normal price less the discount percentage (rounded to the dirham — as the server does).
  const o = liveOffer(item)
  const p = Number(o?.price) > 0 ? Number(o!.price) : discountOf(o) && normalPrice > 0 ? Math.round(normalPrice * (100 - discountOf(o)) / 100) : 0
  return o && p > 0 && p < normalPrice ? p : null
}
export const effectivePrice = (item: { offer?: Offer | null }, normalPrice: number) => offerPrice(item, normalPrice) ?? normalPrice
// The picture a card shows: the offer's own thumbnail while the offer is live (never part of the gallery).
export const offerThumbnail = (item: { offer?: Offer | null }) => liveOffer(item)?.thumbnail || null

// "Ends today" · "Ends tomorrow" · "5 days left" · "Ends 12 Nov" — nothing when the offer has no end date.
export function offerEnds(o: Offer | null, now = new Date()): string {
  if (!o?.endsAt) return ''
  const days = Math.ceil((new Date(o.endsAt).getTime() - now.getTime()) / 86_400_000)
  if (days <= 0) return ''
  if (days === 1) return 'Ends today'
  if (days === 2) return 'Ends tomorrow'
  if (days <= 30) return `${days - 1} days left`
  return `Ends ${new Date(o.endsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
}
export const offerSavingPct = (normal: number, offer: number) => Math.round(((normal - offer) / normal) * 100)
