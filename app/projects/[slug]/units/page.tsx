import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { projectAPI } from '@/lib/api'
import { fitTitle, fitDescription, shareImages } from '@/lib/seo'
import { projectKeywords } from '@/lib/listingSeo'
import { formatPrice } from '@/lib/utils'
import { liveOffer, offerPrice } from '@/lib/offer'
import type { ProjectGroup } from '@/types'
import ProjectUnitsClient from './ProjectUnitsClient'

// "Unit types & prices" — the whole project on one page when it was entered once per unit type: every photo, the
// launch price, payment plans and handover, offers, then every unit with its details, filters and a comparison table.
// One address per project is indexed (the first record's); the same page under another unit's slug points to it.
export const revalidate = 60

const SITE = 'https://www.distressdealsuae.com'

const getGroup = cache(async (slug: string): Promise<ProjectGroup | null> => {
  try { const r = await projectAPI.getGroup(slug); return r.data.success ? r.data.data : null } catch { return null }
})

const bedsText = (b?: string) => (!b ? '' : /studio/i.test(b) ? 'studio' : /\d/.test(b) ? `${b.match(/\d+/)![0]} bedroom` : b.toLowerCase())

function keywordsFor(g: ProjectGroup): string[] {
  const p = g.project, name = p.title.trim()
  const beds = [...new Set(g.units.map(u => bedsText(u.bedrooms)).filter(Boolean))]
  const types = [...new Set(g.units.map(u => (u.type || '').replace(/_/g, ' ')).filter(Boolean))]
  return [...new Set([
    `${name} unit types`, `${name} prices`, `${name} price list`, `${name} payment plan`, `${name} floor plans`,
    `${name} handover`, `${name} launch price`, `${name} ${p.developer}`,
    ...beds.slice(0, 5).map(b => `${name} ${b} price`),
    ...types.map(t => `${name} ${t}s`),
    g.units.some(u => liveOffer(u)) && `${name} offer`,
    ...projectKeywords(p),
  ].filter(Boolean) as string[])].slice(0, 30)
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const g = await getGroup(params.slug)
  if (!g) return { title: 'Project Not Found', robots: { index: false, follow: false } }
  const p = g.project
  const name = p.title.trim()
  const url = `/projects/${g.canonicalSlug}/units`
  const title = `${name} Prices, Unit Types & Payment Plan | ${p.developer}`
  const description = `${name} by ${p.developer} in ${[p.community, p.area].filter(Boolean).join(', ')}: ${g.units.length} unit types${g.launchPrice ? ` from ${formatPrice(g.launchPrice)}` : ''}.${g.paymentPlans.length ? ` ${g.paymentPlans.join(' / ')} payment plan.` : ''}${g.handovers.length ? ` Handover ${g.handovers.join(', ')}.` : ''} Compare sizes, prices and offers.`
  const images = shareImages(g.gallery[0], name)
  return {
    title: fitTitle(title),
    description: fitDescription(description),
    keywords: keywordsFor(g),
    alternates: { canonical: url },
    // A project with a single record has nothing to compare: its own page already says it all.
    robots: g.units.length > 1 ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description, type: 'website', url, images },
    twitter: { card: 'summary_large_image', title, description, images: images.map(i => i.url) },
  }
}

export default async function ProjectUnitsPage({ params }: { params: { slug: string } }) {
  const g = await getGroup(params.slug)
  if (!g) notFound()
  const p = g.project, name = p.title.trim()
  const pageUrl = `${SITE}/projects/${g.canonicalSlug}/units`
  const prices = g.units.map(u => offerPrice(u, u.priceFrom || 0) || u.priceFrom || 0).filter(Boolean)
  const address = { '@type': 'PostalAddress', addressLocality: p.area, addressRegion: p.emirate, addressCountry: 'AE', ...(p.community ? { streetAddress: p.community } : {}) }

  // Facts only — every figure below is read from the project records.
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Projects', item: `${SITE}/projects` },
        { '@type': 'ListItem', position: 3, name, item: `${SITE}/projects/${g.canonicalSlug}` },
        { '@type': 'ListItem', position: 4, name: 'Unit types & prices', item: pageUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Residence',
      name,
      url: pageUrl,
      description: String(p.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300),
      image: g.gallery.slice(0, 10),
      address,
      ...(p.coordinates ? { geo: { '@type': 'GeoCoordinates', latitude: p.coordinates.lat, longitude: p.coordinates.lng } } : {}),
      keywords: keywordsFor(g).slice(0, 12).join(', '),
    },
    ...(prices.length ? [{
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `${name} by ${p.developer}`,
      image: g.gallery.slice(0, 5),
      brand: { '@type': 'Brand', name: p.developer },
      offers: { '@type': 'AggregateOffer', priceCurrency: 'AED', lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: prices.length, url: pageUrl },
    }] : []),
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${name} unit types`,
      numberOfItems: g.units.length,
      itemListElement: g.units.map((u, i) => ({
        '@type': 'ListItem', position: i + 1, url: `${SITE}/projects/${u.slug}`,
        name: `${name} ${bedsText(u.bedrooms)} ${(u.type || 'unit').replace(/_/g, ' ')}`.replace(/\s+/g, ' ').trim(),
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        g.launchPrice && { q: `What is the starting price of ${name}?`, a: `Units at ${name} start from ${formatPrice(g.launchPrice)}${g.maxPrice > g.launchPrice ? `, up to ${formatPrice(g.maxPrice)}` : ''}.` },
        g.paymentPlans.length && { q: `What is the payment plan for ${name}?`, a: `${name} is offered on a ${g.paymentPlans.join(' or ')} payment plan.` },
        g.handovers.length && { q: `When is the handover of ${name}?`, a: `Handover of ${name} is scheduled for ${g.handovers.join(', ')}.` },
        { q: `What unit types are available at ${name}?`, a: `${name} has ${g.units.length} unit types: ${[...new Set(g.units.map(u => `${bedsText(u.bedrooms)} ${(u.type || '').replace(/_/g, ' ')}`.trim()))].join(', ')}.` },
        { q: `Where is ${name} located?`, a: `${name} by ${p.developer} is in ${[p.community, p.area, p.emirate].filter(Boolean).join(', ')}.` },
      ].filter(Boolean).map((f: any) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ]

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProjectUnitsClient group={g} slug={params.slug} />
    </>
  )
}
