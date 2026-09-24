import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import { resolveSeo } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('sitemap', {
    title: 'Sitemap | Distress Deals Dubai',
    description: 'Every section of Distress Deals Dubai in one place — buy, rent, off-plan projects, area guides, and more.',
    path: '/sitemap',
  })
}

const GROUPS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Buy & Rent',
    links: [
      { label: 'Property for Sale', href: '/for-sale' },
      { label: 'Property for Rent', href: '/for-rent' },
      { label: 'Off-Plan Projects', href: '/projects' },
      { label: 'Mortgage & Rental Yield Calculator', href: '/mortgage' },
    ],
  },
  {
    heading: 'Distress Sales',
    links: [
      { label: 'Distress Sale Dubai', href: '/distress-sale-dubai' },
      { label: 'Distressed Villas in Dubai', href: '/distressed-villas-dubai' },
      { label: 'Dubai Property Auctions', href: '/dubai-property-auctions' },
      { label: 'Sell Your Property Fast', href: '/sell-property-fast-dubai' },
      { label: 'Free Property Valuation', href: '/free-property-valuation-dubai' },
    ],
  },
  {
    heading: 'Guides',
    links: [
      { label: 'Area Guides', href: '/areas' },
      { label: 'Communities', href: '/communities' },
      { label: 'Buildings & Towers', href: '/buildings' },
      { label: 'Insights Hub', href: '/insights' },
      { label: 'Blog', href: '/blog' },
      { label: 'News', href: '/news' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'List Your Property', href: '/seller/register' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Sign In', href: '/auth/login' },
      { label: 'Create an Account', href: '/auth/register' },
      { label: 'Seller Sign In', href: '/seller/login' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  },
]

export default function SitemapPage() {
  return (
    <div className="page">
      <Navbar />
      <section className="section">
        <div className="wrap" style={{ maxWidth: 900 }}>
          <p className="eyebrow mb-3">Site Map</p>
          <h1 className="heading-xl mb-3">Find Your Way Around</h1>
          <p className="muted mb-12">Every section of Distress Deals Dubai, in one place.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {GROUPS.map(group => (
              <div key={group.heading}>
                <h2 className="heading-md mb-4">{group.heading}</h2>
                <ul className="space-y-2.5">
                  {group.links.map(link => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm transition-colors hover:text-[var(--teal)]" style={{ color: 'var(--text-mid)' }}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="muted mt-12 text-xs">
            Looking for the XML version for search engines?{' '}
            <a href="/sitemap.xml" style={{ color: 'var(--teal)' }}>View sitemap.xml</a>
          </p>
        </div>
      </section>
      <Footer />
    </div>
  )
}
