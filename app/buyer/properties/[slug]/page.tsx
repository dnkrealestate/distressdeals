import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { propertyAPI } from '@/lib/api'
import PropertyDetailClient from './PropertyDetailClient'
import type { Property } from '@/types'

const getProperty = cache(async (slug: string): Promise<Property | null> => {
  try {
    const res = await propertyAPI.getOne(slug)
    return res.data.success ? res.data.data : null
  } catch {
    return null
  }
})

function bedroomsLabel(property: Property): string {
  return property.amenities?.bedrooms > 0 ? `${property.amenities.bedrooms}-Bedroom` : 'Studio'
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const property = await getProperty(params.slug)
  if (!property) return { title: 'Property Not Found' }

  const action = property.listingType === 'sale' ? 'for Sale' : 'for Rent'
  const title = property.metaTitle?.trim() || `${bedroomsLabel(property)} ${property.type?.replace('_', ' ')} ${action} in ${property.location.area}, Dubai`
  const description = property.metaDescription?.trim() || `${bedroomsLabel(property)} ${property.type} ${action.toLowerCase()} in ${property.location.area} — ${property.amenities.floorArea.toLocaleString()} sqft, ${property.amenities.bathrooms} bathrooms. Listed at ${property.price.toLocaleString()} AED. Verified listing, managed end-to-end by Distress Deals UAE.`
  const images = property.images?.length > 0 ? [{ url: property.images[0].url }] : undefined

  return {
    title,
    description,
    alternates: { canonical: `/buyer/properties/${property.slug}` },
    openGraph: { title, description, type: 'website', url: `/buyer/properties/${property.slug}`, images },
    twitter: { card: 'summary_large_image', title, description, images: property.images?.[0]?.url ? [property.images[0].url] : undefined },
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.distressdealsuae.com'

export default async function PropertyDetailPage({ params }: { params: { slug: string } }) {
  const property = await getProperty(params.slug)
  if (!property) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description.replace(/<[^>]*>/g, '').slice(0, 300),
    ...(property.seoKeywords?.length && { keywords: [property.focusKeyword, ...property.seoKeywords].filter(Boolean).join(', ') }),
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
    numberOfRooms: property.amenities?.bedrooms,
    numberOfBathroomsTotal: property.amenities?.bathrooms,
    floorSize: { '@type': 'QuantitativeValue', value: property.amenities?.floorArea, unitCode: 'FTK' },
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
      { '@type': 'ListItem', position: 2, name: 'Properties', item: `${SITE_URL}/buyer/properties` },
      { '@type': 'ListItem', position: 3, name: property.title, item: `${SITE_URL}/buyer/properties/${property.slug}` },
    ],
  }

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <PropertyDetailClient property={property} />
    </>
  )
}
