import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { propertyAPI } from '@/lib/api'
import PropertyDetailClient from './PropertyDetailClient'
import type { Property } from '@/types'
import { shareImages, fitTitle, fitDescription } from '@/lib/seo'
import { propertyKeywords } from '@/lib/listingSeo'
import { areaPageHref } from '@/lib/areaLink'
import { displayTitle } from '@/lib/utils'

// Edited in the admin — serve the latest version (rebuilt at most every 60 s).
export const revalidate = 60

const getProperty = cache(async (slug: string): Promise<Property | null> => {
  try {
    const res = await propertyAPI.getOne(slug)
    return res.data.success ? res.data.data : null
  } catch {
    return null
  }
})

// Bedrooms only describe homes — a shop, office, warehouse or plot with 0 bedrooms is not a "Studio".
const RESIDENTIAL = new Set(['apartment', 'villa', 'townhouse', 'penthouse', 'studio'])
function bedroomsLabel(property: Property): string {
  if (property.type === 'studio') return ''
  if (!RESIDENTIAL.has(property.type)) return ''
  return property.amenities?.bedrooms > 0 ? `${property.amenities.bedrooms}-Bedroom` : 'Studio'
}
const typeLabel = (property: Property) => (property.type || 'property').replace(/_/g, ' ')
// "2-Bedroom apartment" / "studio" / "retail" — the listing's own facts, nothing filled in.
const whatItIs = (property: Property) => [bedroomsLabel(property), typeLabel(property)].filter(Boolean).join(' ')

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const property = await getProperty(params.slug)
  if (!property) return { title: 'Property Not Found' }

  const action = property.listingType === 'sale' ? 'for Sale' : 'for Rent'
  const place = [property.location.area, property.location.emirate || 'Dubai'].filter(Boolean).join(', ')
  const what = whatItIs(property)
  const title = property.metaTitle?.trim() || `${what.charAt(0).toUpperCase()}${what.slice(1)} ${action} in ${place}`
  // Only facts the listing has — no "0 sqft, 0 bathrooms" when a field is empty.
  const facts = [
    property.amenities?.floorArea > 0 && `${property.amenities.floorArea.toLocaleString()} sqft`,
    property.amenities?.bathrooms > 0 && `${property.amenities.bathrooms} bathroom${property.amenities.bathrooms === 1 ? '' : 's'}`,
  ].filter(Boolean).join(', ')
  const description = property.metaDescription?.trim() || `${what.charAt(0).toUpperCase()}${what.slice(1)} ${action.toLowerCase()} in ${place}${facts ? ` — ${facts}` : ''}. Listed at ${property.price.toLocaleString()} AED. Verified listing, managed end-to-end by Distress Deals UAE.`
  const images = shareImages(property.images?.[0]?.url)

  return {
    title: fitTitle(title),
    description: fitDescription(description),
    keywords: propertyKeywords(property),
    alternates: { canonical: `/buyer/properties/${property.slug}` },
    openGraph: { title, description, type: 'website', url: `/buyer/properties/${property.slug}`, images },
    twitter: { card: 'summary_large_image', title, description, images: images.map(i => i.url) },
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.distressdealsuae.com'

export default async function PropertyDetailPage({ params }: { params: { slug: string } }) {
  const property = await getProperty(params.slug)
  if (!property) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: displayTitle(property.title),
    description: property.description.replace(/<[^>]*>/g, '').slice(0, 300),
    keywords: propertyKeywords(property).join(', '),
    url: `${SITE_URL}/buyer/properties/${property.slug}`,
    datePosted: property.createdAt,
    image: property.images?.map(i => i.url),
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.location.area,
      addressRegion: property.location.emirate,
      addressCountry: 'AE',
    },
    ...(property.location.coordinates && {
      geo: { '@type': 'GeoCoordinates', latitude: property.location.coordinates.lat, longitude: property.location.coordinates.lng },
    }),
    // Empty fields are left out rather than stated as 0.
    ...(RESIDENTIAL.has(property.type) && property.amenities?.bedrooms >= 0 ? { numberOfRooms: property.amenities.bedrooms } : {}),
    ...(property.amenities?.bathrooms > 0 ? { numberOfBathroomsTotal: property.amenities.bathrooms } : {}),
    ...(property.amenities?.floorArea > 0 ? { floorSize: { '@type': 'QuantitativeValue', value: property.amenities.floorArea, unitCode: 'FTK' } } : {}),
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'AED',
      availability: 'https://schema.org/InStock',
      businessFunction: property.listingType === 'sale' ? 'https://schema.org/Sell' : 'https://schema.org/LeaseOut',
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: property.listingType === 'rent' ? 'For Rent' : 'For Sale', item: `${SITE_URL}/${property.listingType === 'rent' ? 'for-rent' : 'for-sale'}` },
      { '@type': 'ListItem', position: 3, name: displayTitle(property.title), item: `${SITE_URL}/buyer/properties/${property.slug}` },
    ],
  }

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <PropertyDetailClient property={property} areaHref={await areaPageHref(property.location?.area)} />
    </>
  )
}
