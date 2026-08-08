import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export function formatPrice(price: number, currency = 'AED'): string {
  if (price >= 1_000_000) return `${currency} ${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 2)}M`
  if (price >= 1_000)     return `${currency} ${(price / 1_000).toFixed(price % 1_000 === 0 ? 0 : 0)}K`
  return `${currency} ${price.toLocaleString()}`
}

export function formatArea(sqft: number): string {
  return sqft >= 1000 ? `${(sqft / 1000).toFixed(1)}K` : sqft.toLocaleString()
}

// Rent listings quote AED either yearly or monthly, per the seller's choice —
// default to yearly for older listings created before rentFrequency existed.
export function rentSuffix(p: { listingType: string; rentFrequency?: string }): string {
  if (p.listingType !== 'rent') return ''
  return p.rentFrequency === 'monthly' ? '/mo' : '/yr'
}

export function rentPeriodLabel(p: { listingType: string; rentFrequency?: string }): string {
  if (p.listingType !== 'rent') return ''
  return p.rentFrequency === 'monthly' ? 'per month' : 'per year'
}

export function timeAgo(date: string): string {
  try { return formatDistanceToNow(parseISO(date), { addSuffix: true }) }
  catch { return '' }
}

export function formatDate(date: string, fmt = 'dd MMM yyyy'): string {
  try { return format(parseISO(date), fmt) }
  catch { return '' }
}

export function formatDateTime(date: string): string {
  return formatDate(date, 'dd MMM yyyy, hh:mm a')
}

export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + '…' : str
}

export function propertyTypeLabel(type: string): string {
  const map: Record<string, string> = {
    apartment: 'Apartment', villa: 'Villa', townhouse: 'Townhouse',
    penthouse: 'Penthouse', studio: 'Studio', office: 'Office',
    retail: 'Retail', warehouse: 'Warehouse', plot: 'Plot',
  }
  return map[type] || type
}

export function leadStatusColor(status: string): string {
  const map: Record<string, string> = {
    new: 'badge-blue', contacted: 'badge-gold', qualified: 'badge-gold',
    touring: 'badge-purple', negotiating: 'badge-gold',
    deal_closed: 'badge-green', deal_lost: 'badge-red', cancelled: 'badge-gray',
  }
  return map[status] || 'badge-gray'
}

export function propertyStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'badge-gray', under_review: 'badge-blue', approved: 'badge-green',
    rejected: 'badge-red', published: 'badge-green', sold: 'badge-gold', withdrawn: 'badge-gray',
  }
  return map[status] || 'badge-gray'
}

export function numberWithCommas(n: number): string {
  return n.toLocaleString('en-AE')
}