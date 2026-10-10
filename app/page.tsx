import type { Metadata } from 'next'
import { homepageAPI, quickLinksAPI, propertyAPI, communityContentAPI, developerAPI } from '@/lib/api'
import { resolveSeo } from '@/lib/seo'
import HomeClient from '@/components/HomeClient'
import type { HomepageContent } from '@/types'

// Homepage content, featured lists and search links come from the admin / database — refresh every 60 s.
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('home', {
    title: 'Distress Sale Dubai | Distressed Property Deals UAE',
    description: "Dubai's centralized real estate platform. Every listing verified, one dedicated agent from first message to keys-in-hand — buy, sell, or rent with confidence.",
    path: '/',
    keywords: [
      'distress sale Dubai', 'distressed property Dubai', 'distress deals UAE', 'below market value property Dubai', 'property for sale in Dubai',
      'apartments for sale in Dubai', 'villas for sale in Dubai', 'townhouses for sale in Dubai', 'property for rent in Dubai', 'apartments for rent in Dubai',
      'off-plan projects Dubai', 'new projects in Dubai', 'Dubai real estate', 'UAE real estate', 'buy property in Dubai', 'sell property in Dubai',
      'property for sale in Abu Dhabi', 'property for sale in Sharjah', 'Dubai property developers', 'Dubai area guides', 'Dubai communities',
      'real estate investment Dubai', 'direct from owner property Dubai', 'verified property listings UAE',
    ],
  })
}

// Defaults mirror the backend schema's defaults — used only if the CMS
// fetch fails outright, so the homepage never renders empty.
const FALLBACK_CONTENT: HomepageContent = {
  _id: '',
  heroHeadlines: ['Distressed Property Deals in UAE', "Invest in UAE's Finest", 'Live Where Luxury Meets Life'],
  heroSubtitle: "Discover exclusive villas, apartments & penthouses. Buy, sell, or rent — managed by Dubai's most trusted specialists.",
  heroMiniStats: [{ value: '2,400+', label: 'Active Listings' }, { value: '850+', label: 'Deals Closed' }, { value: '4.9★', label: 'Client Rating' }],
  whyCards: [
    { icon: 'CheckCircle2', title: 'Verified Listings',    description: 'Every property vetted by our expert team before going live on the platform.' },
    { icon: 'ShieldCheck',  title: 'Managed Deals',        description: 'We handle negotiations, paperwork, and meetings end-to-end so you focus on what matters.' },
    { icon: 'Lock',         title: 'Secure Transactions',  description: 'Your privacy and funds stay protected with bank-grade security throughout the process.' },
    { icon: 'BarChart3',    title: 'Market Intelligence',  description: 'Real-time data and analytics to guide smarter investment decisions across all Emirates.' },
    { icon: 'Link2',        title: 'Direct Deals',         description: 'Buyers and sellers connect directly — no hidden intermediaries, no inflated commissions.' },
    { icon: 'Globe2',       title: 'Full UAE Coverage',    description: 'Properties across all 7 Emirates, with specialist knowledge and deep focus on Dubai.' },
  ],
  statsStrip: [
    { icon: 'Users',      value: '12,000+',  label: 'Happy Clients' },
    { icon: 'Building2',  value: '2,400+',   label: 'Active Listings' },
    { icon: 'DollarSign', value: 'AED 2.4B', label: 'Property Value' },
    { icon: 'Shield',     value: '100%',     label: 'Secure & Verified' },
  ],
}

async function getHomepageContent(): Promise<HomepageContent> {
  try {
    const res = await homepageAPI.get()
    return res.data.success ? res.data.data : FALLBACK_CONTENT
  } catch {
    return FALLBACK_CONTENT
    
  }
}


export default async function HomePage() {
  // "Popular Real Estate Searches" — live search links for each tab, fetched on the server so they're crawlable.
  const links = (kind: 'sale' | 'rent' | 'projects') => quickLinksAPI.get(kind).then(r => (r.data.success ? r.data.data : null)).catch(() => null)
  // Areas, communities and developers for the keyword sections — fetched here so their links are in the page's HTML.
  const list = (p: Promise<any>) => p.then(r => (r.data.success && Array.isArray(r.data.data) ? r.data.data : [])).catch(() => [])
  const [content, sale, rent, projects, areas, communities, developers] = await Promise.all([
    getHomepageContent(), links('sale'), links('rent'), links('projects'),
    list(propertyAPI.getAllAreas()), list(communityContentAPI.getAll({ fields: 'card' })), list(developerAPI.getAll()),
  ])
  // Areas and communities with the most listings (properties + new projects) first; ties keep their A–Z order.
  const listed = (x: any) => (x.count || 0) + (x.projectCount || 0)
  areas.sort((a: any, b: any) => listed(b) - listed(a) || String(a.area).localeCompare(String(b.area)))
  communities.sort((a: any, b: any) => listed(b) - listed(a) || Number(!!b.isFeatured) - Number(!!a.isFeatured) || String(a.name).localeCompare(String(b.name)))
  // Featured developers first (the "Featured" switch in Admin → Developers), then the ones with the most projects.
  developers.sort((a: any, b: any) => Number(!!b.isFeatured) - Number(!!a.isFeatured) || (b.projectCount || 0) - (a.projectCount || 0))
  // Only the fields the sections show — everything handed to the page is also embedded in its HTML, so full records
  // (descriptions, SEO fields, photos credits…) would make every visitor download several hundred KB for nothing.
  const guides = {
    areas: areas.map((a: any) => ({ area: a.area, slug: a.slug, count: a.count, projectCount: a.projectCount })),
    communities: communities.map((c: any) => ({ _id: c._id, name: c.name, slug: c.slug, area: c.area, count: c.count, isFeatured: c.isFeatured })),
    developers: developers.map((d: any) => ({ _id: d._id, name: d.name, slug: d.slug, logo: d.logo, projectCount: d.projectCount, isFeatured: d.isFeatured })),
  }
  return <HomeClient content={content} popularSearches={{ sale, rent, projects }} guides={guides} />
}
