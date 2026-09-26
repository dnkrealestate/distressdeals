// Feature tags written automatically onto listings by the backend (backend/src/utils/listingTags.ts) — the words
// used for them in "More searches" links, page headings and titles.
export type ListingKind = 'sale' | 'rent' | 'projects'

export const TAG_LABELS: Record<string, string> = {
  'cheap': 'Cheap', 'luxury': 'Luxury', 'brand-new': 'Brand New', 'installments': 'On Installment',
  'post-handover-plan': 'Post-Handover Payment Plan', 'investment': 'Investment', 'direct-from-owner': 'Direct from Owner',
  'direct-from-developer': 'Direct from Developer', 'mansions': 'Mansions', 'penthouses': 'Penthouses',
  'family-homes': 'Family Homes', 'waterfront': 'Waterfront', 'golf': 'Golf Course', 'branded-residences': 'Branded Residences',
  'ready-to-move': 'Ready to Move In', 'furnished': 'Furnished', 'distress-deals': 'Distress Sale',
}

const TYPE_PLURAL: Record<string, string> = {
  apartment: 'Apartments', villa: 'Villas', townhouse: 'Townhouses', penthouse: 'Penthouses', studio: 'Studios', duplex: 'Duplexes',
  office: 'Offices', retail: 'Shops', shop: 'Shops', warehouse: 'Warehouses', land: 'Plots', plot: 'Plots', hotel_apartment: 'Hotel Apartments',
  commercial_villa: 'Commercial Villas', building: 'Buildings', full_floor: 'Full Floors',
}
export const typePlural = (t: string) => TYPE_PLURAL[t] || `${t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}s`

// "Cheap properties for sale in UAE", "Properties for sale on installment in UAE", "Luxury new projects in UAE"…
export function tagHeadline(tag: string, kind: ListingKind, place = 'UAE'): string {
  const label = TAG_LABELS[tag] || tag
  const what = kind === 'projects' ? 'new projects' : 'properties'
  const verb = kind === 'rent' ? 'for rent' : kind === 'sale' ? 'for sale' : ''
  const tail = [verb, `in ${place}`].filter(Boolean).join(' ')
  switch (tag) {
    case 'brand-new': return kind === 'projects' ? `Brand new projects in ${place}` : `Brand new properties ${tail}`
    case 'investment': return kind === 'projects' ? `New projects for investment in ${place}` : `Investment properties ${tail}`
    case 'cheap': return kind === 'projects' ? `Affordable new projects in ${place}` : `Cheap properties ${tail}`
    case 'installments': return kind === 'projects' ? `New projects on installment in ${place}` : `Properties ${tail.replace(' in ', ' on installment in ')}`
    case 'post-handover-plan': return `${kind === 'projects' ? 'New projects' : 'Properties'} with post-handover payment plans in ${place}`
    case 'direct-from-owner': return `Direct from owner properties ${tail}`
    case 'direct-from-developer': return `New projects direct from the developer in ${place}`
    case 'ready-to-move': return `Ready to move in ${kind === 'projects' ? 'projects' : 'properties'} ${tail}`
    case 'golf': return `Golf course ${what} ${tail}`
    case 'distress-deals': return `Distress sale properties in ${place}`
    // Already a kind of home — "Mansions for sale in UAE"
    case 'mansions': case 'penthouses': case 'family-homes': case 'branded-residences':
      return `${label} ${kind === 'projects' ? `in new projects in ${place}` : tail}`
    default: return `${label} ${what} ${tail}`
  }
}
