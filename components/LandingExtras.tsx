import Link from 'next/link'
import { ArrowRight, Home, KeyRound, Layers, Tag } from 'lucide-react'
import PropertyCard from '@/components/buyer/PropertyCard'
import FaqSection, { type Faq } from '@/components/shared/FaqSection'
import { propertyAPI, communityContentAPI } from '@/lib/api'
import type { Property, CommunityContentWithStats } from '@/types'

// The lower half of every distress-sale landing page, server-rendered: live verified listings, a call to action for
// buyers and one for sellers, links to the communities with the most listings, related guides, and the page's FAQs
// (with FAQPage markup). Listings and community counts are live data; the FAQs are each page's own text.
export interface RelatedGuide { href: string; label: string; text: string }

export default async function LandingExtras({ listingTitle, listingParams, viewAllHref, faqTitle, faqs, related }: {
  listingTitle: string
  listingParams: Record<string, string | number>
  viewAllHref: string
  faqTitle: string
  faqs: Faq[]
  related: RelatedGuide[]
}) {
  const [listings, communities] = await Promise.all([
    propertyAPI.getAll({ ...listingParams, limit: 6 }).then(r => (r.data.success ? (r.data.data.data || []) as Property[] : [])).catch(() => [] as Property[]),
    communityContentAPI.getAll({ fields: 'card' }).then(r => (r.data.success && Array.isArray(r.data.data) ? r.data.data as CommunityContentWithStats[] : [])).catch(() => [] as CommunityContentWithStats[]),
  ])
  const topCommunities = [...communities].sort((a, b) => (b.count || 0) - (a.count || 0) || Number(!!b.isFeatured) - Number(!!a.isFeatured)).slice(0, 20)

  return (
    <>
      <section className="section section-alt" aria-labelledby="live-listings">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <h2 id="live-listings" className="heading-md">{listingTitle}</h2>
            <Link href={viewAllHref} className="btn-ghost btn-sm gap-1.5">View all <ArrowRight size={13} /></Link>
          </div>
          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(p => <PropertyCard key={p._id} property={p} />)}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No matching listings are live this minute — new verified listings are added daily. <Link href={viewAllHref} className="underline" style={{ color: 'var(--teal)' }}>See everything for sale</Link>.
            </p>
          )}
        </div>
      </section>

      <section className="section" aria-label="For buyers and sellers">
        <div className="wrap grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><Home size={13} /> For buyers</p>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Looking for a below-market property?</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-mid)' }}>Every listing is checked by our team before it goes live, and one dedicated agent handles your enquiry from first message to transfer — no third-party brokers.</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/for-sale" className="btn-primary btn-sm gap-1.5">Property for sale <ArrowRight size={13} /></Link>
              <Link href="/projects" className="btn-ghost btn-sm">Off-plan projects</Link>
            </div>
          </div>
          <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><Tag size={13} /> For sellers</p>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Need to sell quickly?</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-mid)' }}>List your property directly with us. Our team verifies it, prices it against recent sales and puts it in front of buyers who are actively looking for fast, fair deals.</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/sell" className="btn-primary btn-sm gap-1.5">List your property <ArrowRight size={13} /></Link>
              <Link href="/free-property-valuation-dubai" className="btn-ghost btn-sm">Free valuation</Link>
            </div>
          </div>
        </div>
      </section>

      {topCommunities.length > 0 && (
        <section className="pb-14" aria-labelledby="by-community">
          <div className="wrap">
            <h2 id="by-community" className="heading-md mb-2 flex items-center gap-2"><Layers size={18} style={{ color: 'var(--teal)' }} /> Distress deals by community</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Community guides with property prices, schools, hospitals and what is for sale and rent there now.</p>
            <div className="flex flex-wrap gap-2">
              {topCommunities.map(c => (
                <Link key={c._id} href={`/communities/${c.slug}`} className="px-3.5 py-2 rounded-xl text-sm font-medium" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}>
                  Distress sale in {c.name}{c.count ? <span style={{ color: 'var(--text-muted)' }}> · {c.count}</span> : null}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="pb-14" aria-labelledby="related-guides">
          <div className="wrap">
            <h2 id="related-guides" className="heading-md mb-5 flex items-center gap-2"><KeyRound size={18} style={{ color: 'var(--teal)' }} /> Related guides</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map(r => (
                <Link key={r.href} href={r.href} className="card p-5 group">
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-[var(--teal)] transition-colors" style={{ color: 'var(--text)' }}>{r.label}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.text}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <FaqSection title={faqTitle} faqs={faqs} />
    </>
  )
}

// The landing pages, for "Related guides" — each page leaves itself out.
export const LANDING_GUIDES: RelatedGuide[] = [
  { href: '/distress-sale-dubai', label: 'Distress Sale Dubai', text: 'What a distress sale is and how to buy one safely.' },
  { href: '/distressed-property-for-sale', label: 'Distressed Property for Sale', text: 'Every below-market property type in one place.' },
  { href: '/distressed-villas-dubai', label: 'Distressed Villas in Dubai', text: 'Below-market villas and what to check first.' },
  { href: '/distressed-apartments-dubai', label: 'Distressed Apartments in Dubai', text: 'Below-market apartments and how to judge them.' },
  { href: '/panic-selling-dubai', label: 'Panic Selling in Dubai', text: 'Why owners sell in a hurry, and how to respond.' },
  { href: '/dubai-property-auctions', label: 'Dubai Property Auctions', text: 'Auctions compared with a negotiated sale.' },
  { href: '/sell-property-fast-dubai', label: 'Sell Your Property Fast', text: 'A quick, verified exit for owners.' },
  { href: '/free-property-valuation-dubai', label: 'Free Property Valuation', text: 'Know what your property is worth today.' },
]
export const otherGuides = (self: string, n = 4) => LANDING_GUIDES.filter(g => g.href !== self).slice(0, n)
