import type { PlaceDetail, Review } from '@/types'
import { sectionByKey, placeHref } from '@/lib/explore'

// Search appearance for a place page — title, description, keywords and structured data — written from the place's
// own facts so every page is distinct. Anything an admin types in the SEO tab of the place wins over these.
const SITE_URL = 'https://www.distressdealsuae.com'
const TICKETED = new Set(['Museum', 'Landmark', 'Viewpoint', 'Theme park', 'Water park', 'Zoo & wildlife', 'Art gallery', 'Adventure & sport'])

export const placeWhere = (p: Pick<PlaceDetail, 'area' | 'emirate'>) => [p.area && p.area !== p.emirate ? p.area : '', p.emirate].filter(Boolean).join(', ')

export function placeTitle(p: PlaceDetail): string {
  if (p.metaTitle) return p.metaTitle
  const named = p.name.toLowerCase().includes(p.emirate.toLowerCase()) ? p.name : `${p.name}, ${p.emirate}`
  // Search results show about 65 characters and the site name (21) is added after this — aim for 44 or fewer.
  const tails = p.category === 'mall' || p.category === 'market' ? ['Timings, Location & Reviews', 'Location & Reviews']
    : p.category === 'hotel' ? ['Location & Guest Reviews', 'Guest Reviews']
    : p.category === 'food' ? [`${p.cuisine ? `${String(p.cuisine).split(',')[0]} ` : ''}${p.subcategory === 'Café' ? 'Café' : 'Restaurant'}, Location & Reviews`, 'Location & Reviews']
    : TICKETED.has(p.subcategory || '') ? ['Tickets, Timings & Location', 'Tickets & Location']
    : ['Visitor Guide & Location', 'Guide & Location']
  return [`${named}: ${tails[0]}`, `${p.name}: ${tails[0]}`, `${named}: ${tails[1]}`, `${p.name}: ${tails[1]}`, `${p.name}: Guide`].find(t => t.length <= 44) || String(p.name).slice(0, 60)
}

export function placeDescription(p: PlaceDetail): string {
  if (p.metaDescription) return p.metaDescription
  const section = sectionByKey(p.category)!
  const lead = (p.summary || `${p.name} is a ${section.singular} in ${placeWhere(p)}, UAE.`).replace(/\s+/g, ' ').trim()
  const extra = [p.openingHours ? 'opening hours' : '', 'exact location', p.tips?.length ? 'tips' : '', 'what’s nearby', 'visitor reviews'].filter(Boolean).join(', ')
  const closing = ` See ${extra}.`
  const room = 158 - closing.length
  const cut = lead.length > room ? `${lead.slice(0, room - 2).replace(/[ ,;:–—-]+\S*$/, '')}…` : lead
  return `${cut}${closing}`
}

// Property searches people make around a place — added to every place page's keywords.
const realEstateKeywords = (p: Pick<PlaceDetail, 'name' | 'area' | 'emirate'>) => [
  `properties for sale near ${p.name}`, `apartments near ${p.name}`,
  p.area ? `apartments for sale in ${p.area}` : `apartments for sale in ${p.emirate}`,
  p.area ? `properties for rent in ${p.area}` : `properties for rent in ${p.emirate}`,
  `off-plan projects in ${p.emirate}`, `${p.emirate} real estate`,
]

export function placeKeywords(p: PlaceDetail): string[] {
  if (p.seoKeywords?.length) return Array.from(new Set([p.focusKeyword || p.name, ...p.seoKeywords, ...realEstateKeywords(p)]))
  const section = sectionByKey(p.category)!
  const kind = (p.subcategory || section.singular).toLowerCase()
  return Array.from(new Set([
    p.name, `${p.name} ${p.emirate}`, `${p.name} location`, `${p.name} timings`, `${p.name} reviews`,
    p.area ? `${kind} in ${p.area}` : '', `${kind} in ${p.emirate}`, `${section.label.toLowerCase()} in ${p.emirate}`,
    p.area ? `things to do in ${p.area}` : `things to do in ${p.emirate}`,
    p.category === 'attraction' || p.category === 'activity' ? `${p.name} tickets` : '',
    p.category === 'hotel' ? `hotels near ${p.area || p.emirate}` : '',
    ...realEstateKeywords(p),
    p.category === 'food' && p.cuisine ? `${p.cuisine.split(',')[0].toLowerCase()} restaurant ${p.emirate}` : '',
  ].filter(Boolean)))
}

export function placeJsonLd(p: PlaceDetail, description: string, reviews: Review[] = []) {
  const section = sectionByKey(p.category)!
  const url = `${SITE_URL}${placeHref(p)}`
  const c = p.coordinates?.lat != null ? p.coordinates : null
  const type = p.category === 'food' && p.subcategory === 'Café' ? 'CafeOrCoffeeShop'
    : p.category === 'attraction' && p.subcategory === 'Museum' ? ['TouristAttraction', 'Museum']
    : p.category === 'attraction' && p.subcategory === 'Mosque' ? ['TouristAttraction', 'Mosque']
    : p.category === 'activity' && p.subcategory === 'Beach' ? ['TouristAttraction', 'Beach']
    : p.category === 'activity' && /Park & garden/.test(p.subcategory || '') ? ['TouristAttraction', 'Park']
    : p.category === 'activity' && /Theme park|Water park/.test(p.subcategory || '') ? ['TouristAttraction', 'AmusementPark']
    : p.category === 'activity' && /Zoo/.test(p.subcategory || '') ? ['TouristAttraction', 'Zoo']
    : p.category === 'hotel' && p.subcategory === 'Resort' ? 'Resort'
    : section.schemaType
  const image = p.heroImage ? {
    '@type': 'ImageObject', url: p.heroImage, contentUrl: p.heroImage, caption: `${p.name}, ${placeWhere(p)}`,
    ...(p.heroImageCredit?.name ? { creditText: p.heroImageCredit.name, creator: { '@type': 'Person', name: p.heroImageCredit.name }, acquireLicensePage: p.heroImageCredit.url, license: p.heroImageCredit.url } : {}),
  } : undefined

  const place: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${url}#place`,
    name: p.name,
    url,
    description,
    ...(image ? { image } : {}),
    address: { '@type': 'PostalAddress', ...(p.address ? { streetAddress: p.address } : {}), ...(p.area ? { addressLocality: p.area } : {}), addressRegion: p.emirate, addressCountry: 'AE' },
    containedInPlace: { '@type': 'AdministrativeArea', name: `Emirate of ${p.emirate}`, containedInPlace: { '@type': 'Country', name: 'United Arab Emirates' } },
    ...(c ? { geo: { '@type': 'GeoCoordinates', latitude: c.lat, longitude: c.lng }, hasMap: `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}` } : {}),
    ...(p.website ? { sameAs: [p.website] } : {}),
    ...(p.openingHours ? { openingHours: p.openingHours } : {}),
    ...(p.priceLevel && /^free/i.test(p.priceLevel) ? { isAccessibleForFree: true } : {}),
    ...(p.priceLevel && (p.category === 'food' || p.category === 'hotel') ? { priceRange: p.priceLevel } : {}),
    ...(p.category === 'attraction' || p.category === 'activity' || p.category === 'mall' || p.category === 'market' ? { publicAccess: true } : {}),
    ...(p.cuisine && p.category === 'food' ? { servesCuisine: p.cuisine.split(',').map(s => s.trim()) } : {}),
    ...(p.stars && p.category === 'hotel' ? { starRating: { '@type': 'Rating', ratingValue: p.stars } } : {}),
    ...(p.highlights?.length ? { amenityFeature: p.highlights.slice(0, 8).map(h => ({ '@type': 'LocationFeatureSpecification', name: h, value: true })) } : {}),
    ...(p.ratingCount > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.ratingAvg, reviewCount: p.ratingCount, bestRating: 5, worstRating: 1 } } : {}),
    ...(reviews.length ? {
      review: reviews.map(r => ({
        '@type': 'Review', author: { '@type': 'Person', name: r.authorName }, datePublished: r.createdAt?.slice(0, 10),
        reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 }, ...(r.title ? { name: r.title } : {}), reviewBody: r.comment,
      })),
    } : {}),
  }
  const page = {
    '@context': 'https://schema.org', '@type': 'WebPage', '@id': url, url, name: placeTitle(p), description, inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', name: 'Distress Deals UAE', url: SITE_URL },
    about: { '@id': `${url}#place` }, mainEntity: { '@id': `${url}#place` },
    ...(p.heroImage ? { primaryImageOfPage: { '@type': 'ImageObject', url: p.heroImage } } : {}),
    ...(p.updatedAt ? { dateModified: p.updatedAt } : {}), ...(p.createdAt ? { datePublished: p.createdAt } : {}),
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'UAE Explore', item: `${SITE_URL}/explore` },
        { '@type': 'ListItem', position: 3, name: section.label, item: `${SITE_URL}/explore/${section.path}` },
        { '@type': 'ListItem', position: 4, name: p.emirate, item: `${SITE_URL}/explore/${section.path}/${p.emirate.toLowerCase().replace(/\s+/g, '-')}` },
        { '@type': 'ListItem', position: 5, name: p.name, item: url },
      ],
    },
  }
  return [page, place]
}
