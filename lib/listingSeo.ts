import { isHandedOver } from '@/lib/utils'
import type { Project, Property } from '@/types'

// Search phrases for projects and listings, built only from what the record says (type, bedrooms, area, developer).
// Used for the keywords meta tag on detail pages and for the one keyword line on each card.

const words = (s?: string) => (s || '').replace(/_/g, ' ').trim().toLowerCase()
const plural = (s: string) => (!s ? 'properties' : /(s|x|ch|sh)$/.test(s) ? `${s}es` : /[^aeiou]y$/.test(s) ? `${s.slice(0, -1)}ies` : `${s}s`)
const unique = (list: (string | undefined | false)[]) => {
  const seen = new Set<string>()
  return list.map(k => (k || '').replace(/\s+/g, ' ').trim()).filter(k => k && !seen.has(k.toLowerCase()) && !!seen.add(k.toLowerCase()))
}
const bedsOf = (p: Property) => ((p.amenities?.bedrooms ?? 0) > 0 ? `${p.amenities.bedrooms} bedroom` : words(p.type) === 'apartment' ? 'studio' : '')
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// ── Projects ──
export function projectKeyword(p: Project): string {
  const ready = p.status === 'ready' || isHandedOver(p)
  return capital(`${ready ? 'ready' : 'off-plan'} ${plural(words(p.type))} for sale in ${p.area}`)
}

export function projectKeywords(p: Project): string[] {
  const types = plural(words(p.type)), emirate = p.emirate || 'Dubai', title = p.title.trim()
  return unique([
    p.focusKeyword, ...(p.seoKeywords || []),
    title, `${title} ${p.developer}`, `${title} ${p.area}`, `${title} price`, p.paymentPlan && `${title} payment plan`,
    projectKeyword(p).toLowerCase(), `${types} for sale in ${p.area}`, `new projects in ${p.area}`, `off-plan projects in ${p.area}`,
    `property for sale in ${p.area}`, p.community && `${types} for sale in ${p.community}`,
    `${p.developer} projects`, `${p.developer} ${types} in ${emirate}`, `off-plan property in ${emirate}`, `buy property in ${emirate}`, `real estate investment in ${emirate}`,
  ]).slice(0, 18)
}

// ── Listings ──
export function propertyKeyword(p: Property): string {
  const action = p.listingType === 'rent' ? 'rent' : 'sale'
  const type = words(p.type) || 'property', beds = bedsOf(p)
  // "Studio for rent in …" reads better than "Studio apartment for rent in …" and is what people search.
  const what = beds === 'studio' ? 'studio apartment' : `${beds} ${type}`.trim()
  return capital(`${what} for ${action} in ${p.location?.area || p.location?.city || 'Dubai'}`)
}

export function propertyKeywords(p: Property): string[] {
  const action = p.listingType === 'rent' ? 'rent' : 'sale', verb = action === 'rent' ? 'rent' : 'buy'
  const type = words(p.type) || 'property', types = plural(type)
  const area = p.location?.area || '', city = p.location?.city || p.location?.emirate || 'Dubai'
  return unique([
    p.focusKeyword, ...(p.seoKeywords || []),
    propertyKeyword(p).toLowerCase(),
    area && `${types} for ${action} in ${area}`, area && `property for ${action} in ${area}`, area && `${area} ${types}`, area && `${verb} ${type} in ${area}`,
    p.location?.community && `${types} for ${action} in ${p.location.community}`,
    p.projectName && `${p.projectName} ${type} for ${action}`, p.projectName, p.developer && `${p.developer} ${types}`,
    `${types} for ${action} in ${city}`, `property for ${action} in ${city}`, `${verb} property in ${city}`,
    action === 'sale' ? `real estate for sale in ${city}` : `${types} for rent in ${city} monthly and yearly`,
    'verified property listings UAE',
  ]).slice(0, 18)
}
