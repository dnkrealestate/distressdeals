/**
 * Format a numeric price into a human-readable currency string.
 * @param price
 * @param currency - ISO currency code (default: 'AED')
 * @param locale   - BCP 47 locale tag (default: 'en-AE')
 */
export function formatPrice(
  price: number | null | undefined,
  currency: string = 'AED',
  locale: string = 'en-AE'
): string {
  if (price == null || isNaN(price)) return '—'

  if (price >= 1_000_000) {
    const millions = price / 1_000_000
    const formatted = millions % 1 === 0 ? millions : millions.toFixed(2)
    return `${currency} ${formatted}M`
  }

  if (price >= 1_000) {
    const thousands = price / 1_000
    const formatted = thousands % 1 === 0 ? thousands : thousands.toFixed(1)
    return `${currency} ${formatted}K`
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Format an area value with a unit label.
 * @param area
 * @param unit - display unit (default: 'sq ft')
 */
export function formatArea(
  area: number | null | undefined,
  unit: string = 'sq ft'
): string {
  if (area == null || isNaN(area)) return '—'
  return `${new Intl.NumberFormat('en-AE').format(area)} ${unit}`
}

/**
 * Return a human-friendly relative time string (e.g. "3 days ago").
 * Falls back to a locale date string for dates older than a year.
 * @param date
 */
export function timeAgo(date: string | number | Date | null | undefined): string {
  if (!date) return '—'

  const then = new Date(date)
  if (isNaN(then.getTime())) return '—'

  const seconds = Math.floor((Date.now() - then.getTime()) / 1000)

  if (seconds < 0) return 'just now'
  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`

  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`

  return then.toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' })
}