import type { Metadata } from 'next'
import { homepageAPI, quickLinksAPI } from '@/lib/api'
import { resolveSeo } from '@/lib/seo'
import HomeClient from '@/components/HomeClient'
import type { HomepageContent } from '@/types'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('home', {
    title: 'Distress Sale Dubai | Distressed Property Deals UAE',
    description: "Dubai's centralized real estate platform. Every listing verified, one dedicated agent from first message to keys-in-hand — buy, sell, or rent with confidence.",
    path: '/',
  })
}

// Defaults mirror the backend schema's defaults — used only if the CMS
// fetch fails outright, so the homepage never renders empty.
const FALLBACK_CONTENT: HomepageContent = {
  _id: '',
  heroHeadlines: ['Distressed Property Deals in Dubai', "Invest in Dubai's Finest", 'Live Where Luxury Meets Life'],
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
  const [content, sale, rent, projects] = await Promise.all([getHomepageContent(), links('sale'), links('rent'), links('projects')])
  return <HomeClient content={content} popularSearches={{ sale, rent, projects }} />
}
