import Link from 'next/link'
import {
  FileText, LayoutTemplate, Search, Building2, Landmark, MapPin, Layers,
  Info, Sparkles, ChevronRight,
} from 'lucide-react'

interface SettingsCard {
  href: string
  icon: any
  title: string
  description: string
}

function CardGrid({ title, cards }: { title: string; cards: SettingsCard[] }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map(c => (
          <Link
            key={c.href} href={c.href}
            className="card p-5 flex items-start gap-3 group transition-transform hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.08)' }}>
              <c.icon size={18} style={{ color: 'var(--teal)' }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm mb-0.5 flex items-center gap-1" style={{ color: 'var(--text)' }}>
                {c.title}
                <ChevronRight size={13} className="opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--text-muted)' }} />
              </p>
              <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>{c.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

const PAGE_CONTENT_CARDS: SettingsCard[] = [
  { href: '/admin/settings/content-pages/about', icon: Info, title: 'About Page', description: 'Mission, values, milestones, and leadership shown on /about' },
  { href: '/admin/settings/content-pages/distress-sale-dubai', icon: Sparkles, title: 'Distress Sale Dubai', description: 'The main distress-sale guide landing page' },
  { href: '/admin/settings/content-pages/distressed-villas-dubai', icon: Sparkles, title: 'Distressed Villas Dubai', description: 'Villa-specific distress sale landing page' },
  { href: '/admin/settings/content-pages/dubai-property-auctions', icon: Sparkles, title: 'Dubai Property Auctions', description: 'Auctions vs. negotiated distress sale landing page' },
  { href: '/admin/settings/content-pages/sell-property-fast-dubai', icon: Sparkles, title: 'Sell Property Fast', description: 'Fast-sale landing page for sellers' },
  { href: '/admin/settings/content-pages/free-property-valuation-dubai', icon: Sparkles, title: 'Free Property Valuation', description: 'Free valuation request landing page' },
]

const SITE_STRUCTURE_CARDS: SettingsCard[] = [
  { href: '/admin/content', icon: FileText, title: 'Content', description: 'Blog posts, news articles, and the editorial calendar' },
  { href: '/admin/homepage', icon: LayoutTemplate, title: 'Homepage', description: 'Hero, stats, and "why choose us" sections' },
  { href: '/admin/seo', icon: Search, title: 'SEO', description: 'Titles, descriptions, and keywords for every page' },
  { href: '/admin/projects', icon: Building2, title: 'Projects', description: 'Off-plan & new development listings' },
  { href: '/admin/developers', icon: Landmark, title: 'Developers', description: 'Developer profiles used across off-plan projects' },
  { href: '/admin/areas', icon: MapPin, title: 'Areas', description: "Insights copy shown on each area's public page" },
  { href: '/admin/communities', icon: Layers, title: 'Communities', description: 'Sub-neighbourhoods and standalone communities' },
  { href: '/admin/buildings', icon: Building2, title: 'Buildings', description: 'Building/tower-level info pages' },
]

export default function AdminSettingsPage() {
  return (
    <div>
      <header className="px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Settings</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Everything that shapes the public site — content, SEO, and structure — in one place</p>
      </header>

      <div className="p-7 space-y-8">
        <CardGrid title="Page Content" cards={PAGE_CONTENT_CARDS} />
        <CardGrid title="Site Structure" cards={SITE_STRUCTURE_CARDS} />
      </div>
    </div>
  )
}
