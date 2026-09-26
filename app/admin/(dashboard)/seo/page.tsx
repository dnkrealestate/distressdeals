'use client'
import { useEffect, useState } from 'react'
import { Save, RotateCcw, ExternalLink } from 'lucide-react'
import { seoAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface SeoRow {
  pageKey: string
  label: string
  path: string
  defaultTitle: string
  defaultDescription: string
}

// Every page wired up to pull from the backend's SeoSetting collection (see lib/seo.ts's resolveSeo, used in
// each page's generateMetadata) — this is the full list, kept in sync with those page.tsx files by hand since
// it's just display metadata (label/path/hardcoded fallback), not something worth round-tripping from the API.
const PAGES: SeoRow[] = [
  { pageKey: 'home', label: 'Homepage', path: '/', defaultTitle: 'Distress Sale Dubai | Distressed Property Deals UAE', defaultDescription: "Dubai's centralized real estate platform. Every listing verified, one dedicated agent from first message to keys-in-hand — buy, sell, or rent with confidence." },
  { pageKey: 'for-sale', label: 'Property for Sale', path: '/for-sale', defaultTitle: 'Distressed Property for Sale in Dubai | Below Market', defaultDescription: 'Distressed and below-market property for sale in Dubai. Verified villas, apartments and penthouses with real pricing, updated daily.' },
  { pageKey: 'for-rent', label: 'Property for Rent', path: '/for-rent', defaultTitle: 'Property for Rent in Dubai | Verified Listings', defaultDescription: 'Verified apartments and villas for rent across Dubai, with genuine availability and no duplicate listings. Updated daily.' },
  { pageKey: 'projects', label: 'Off-Plan Projects', path: '/projects', defaultTitle: 'Off-Plan Projects Dubai | Prices & Payment Plans', defaultDescription: "Explore Dubai's newest off-plan developments — payment plans, handover dates, and prices from leading developers." },
  { pageKey: 'areas', label: 'Area Guides', path: '/areas', defaultTitle: 'Dubai Area Guides: Average Prices by Community', defaultDescription: 'Explore Dubai neighborhoods with real average prices and listing counts from our verified inventory.' },
  { pageKey: 'developers', label: 'Developers', path: '/developers', defaultTitle: 'Dubai Property Developers & Projects', defaultDescription: 'Compare Dubai and UAE developers — Emaar, DAMAC, Sobha, Aldar, Nakheel and more. Live off-plan projects, starting prices, payment plans and handover dates.' },
  { pageKey: 'communities', label: 'Communities', path: '/communities', defaultTitle: 'Dubai Communities Guide', defaultDescription: 'Explore Dubai neighbourhoods and sub-communities — real listing counts and prices from our own verified inventory.' },
  { pageKey: 'buildings', label: 'Buildings & Towers', path: '/buildings', defaultTitle: 'Dubai Buildings & Towers Directory', defaultDescription: 'Building-level guides for Dubai towers and developments — amenities, developer, and year built.' },
  { pageKey: 'mortgage', label: 'Mortgage Calculator', path: '/mortgage', defaultTitle: 'Dubai Mortgage & Rental Yield Calculator', defaultDescription: 'Estimate your monthly mortgage payments and rental yield on any Dubai property.' },
  { pageKey: 'blog', label: 'Blog', path: '/blog', defaultTitle: 'Dubai Property Market Blog', defaultDescription: 'Dubai real estate market trends, buying guides, investment insights, and regulatory news.' },
  { pageKey: 'insights', label: 'Insights Hub', path: '/insights', defaultTitle: 'Dubai Property Market Insights & Price Data', defaultDescription: 'Everything informational in one place — market blog, news, and guides to Dubai areas, communities, and buildings.' },
  { pageKey: 'news', label: 'News', path: '/news', defaultTitle: 'Dubai Real Estate News & Market Updates', defaultDescription: 'Dubai real estate regulatory updates, market announcements, and industry news.' },
  { pageKey: 'about', label: 'About Us', path: '/about', defaultTitle: 'About Distress Deals UAE | Verified Distressed Sales', defaultDescription: 'How Distress Deals UAE sources verified distressed and below-market property across the UAE.' },
  { pageKey: 'contact', label: 'Contact Us', path: '/contact', defaultTitle: 'Contact Us | Distress Deals UAE', defaultDescription: 'Get in touch with Distress Deals UAE — questions about buying, selling, or a specific listing.' },
  { pageKey: 'distress-sale-dubai', label: 'Distress Sale Dubai (hub)', path: '/distress-sale-dubai', defaultTitle: 'Distress Sale Dubai | What It Is & How to Buy Safely', defaultDescription: 'What a distress sale is, why Dubai owners sell below market, typical discounts, and how to verify one is genuine.' },
  { pageKey: 'distressed-villas-dubai', label: 'Distressed Villas', path: '/distressed-villas-dubai', defaultTitle: 'Distress Sale of Villas in Dubai | Below-Market Villas', defaultDescription: 'Distress sale villas across Dubai — Arabian Ranches, Dubai Hills, Emirates Hills, Palm Jumeirah and more.' },
  { pageKey: 'dubai-property-auctions', label: 'Property Auctions', path: '/dubai-property-auctions', defaultTitle: 'Dubai Property Auctions | How They Work & Key Risks', defaultDescription: 'How Dubai property auctions work, the risks of buying at auction, and why a negotiated distress sale is safer.' },
  { pageKey: 'sell-property-fast-dubai', label: 'Sell Fast', path: '/sell-property-fast-dubai', defaultTitle: 'Sell Your Property Fast in Dubai | Quick, Verified Exit', defaultDescription: 'Need to sell a Dubai property quickly? Our process, timeline, required documents, and fees.' },
  { pageKey: 'free-property-valuation-dubai', label: 'Free Valuation', path: '/free-property-valuation-dubai', defaultTitle: 'Free Property Valuation Dubai | Know Your Property’s Value', defaultDescription: 'Get a free, no-obligation valuation for your Dubai property.' },
  { pageKey: 'privacy', label: 'Privacy Policy', path: '/privacy', defaultTitle: 'Privacy Policy | Distress Deals UAE', defaultDescription: 'How Distress Deals UAE collects, uses, and protects your personal information.' },
  { pageKey: 'terms', label: 'Terms of Service', path: '/terms', defaultTitle: 'Terms of Service | Distress Deals UAE', defaultDescription: 'The terms that govern your use of the Distress Deals UAE website and mobile app.' },
  { pageKey: 'cookies', label: 'Cookie Policy', path: '/cookies', defaultTitle: 'Cookie Policy | Distress Deals UAE', defaultDescription: 'How Distress Deals UAE uses cookies, local storage, and analytics tools.' },
  { pageKey: 'sitemap', label: 'Sitemap Page', path: '/sitemap', defaultTitle: 'Sitemap | Distress Deals UAE', defaultDescription: 'Every section of Distress Deals UAE in one place.' },
]

interface OverrideState { title: string; description: string; keywords: string }
const EMPTY: OverrideState = { title: '', description: '', keywords: '' }

function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max
  return <span className="text-[10px]" style={{ color: over ? '#F43F5E' : 'var(--text-muted)' }}>{value.length}/{max}</span>
}

function SeoRowCard({ row, initial, onSaved }: { row: SeoRow; initial: OverrideState; onSaved: (v: OverrideState) => void }) {
  const [value, setValue] = useState<OverrideState>(initial)
  const [saving, setSaving] = useState(false)
  const dirty = value.title !== initial.title || value.description !== initial.description || value.keywords !== initial.keywords

  // Resync if the parent re-fetches (Reload button) and this page's saved values actually changed elsewhere.
  useEffect(() => { setValue(initial) }, [initial])

  async function save() {
    setSaving(true)
    try {
      const res = await seoAPI.update(row.pageKey, value)
      if (res.data.success) {
        onSaved(value)
        toast.success(`${row.label} SEO updated`)
      }
    } catch (err: any) {
      toast.error(err?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function reset() { setValue(EMPTY) }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{row.label}</h3>
          <a href={row.path} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 mt-0.5 hover:underline" style={{ color: 'var(--text-muted)' }}>
            {row.path} <ExternalLink size={10} />
          </a>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} disabled={saving} className="btn-ghost btn-sm gap-1.5" title="Clear override — falls back to the page's default">
            <RotateCcw size={12} /> Reset
          </button>
          <button onClick={save} disabled={saving || !dirty} className="btn-primary btn-sm gap-1.5 disabled:opacity-50">
            <Save size={12} /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-mid)' }}>Title</label>
            <CharCount value={value.title} max={70} />
          </div>
          <input
            className="input w-full text-sm"
            value={value.title}
            onChange={e => setValue(v => ({ ...v, title: e.target.value }))}
            placeholder={row.defaultTitle}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-mid)' }}>Description</label>
            <CharCount value={value.description} max={160} />
          </div>
          <textarea
            className="input w-full text-sm"
            rows={2}
            value={value.description}
            onChange={e => setValue(v => ({ ...v, description: e.target.value }))}
            placeholder={row.defaultDescription}
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-mid)' }}>Keywords (comma-separated, optional)</label>
          <input
            className="input w-full text-sm"
            value={value.keywords}
            onChange={e => setValue(v => ({ ...v, keywords: e.target.value }))}
            placeholder="e.g. distress sale dubai, below market villas"
          />
        </div>
      </div>
    </div>
  )
}

export default function AdminSeoPage() {
  const [overrides, setOverrides] = useState<Record<string, OverrideState> | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    seoAPI.getAll()
      .then(r => {
        if (!r.data.success) return
        const map: Record<string, OverrideState> = {}
        for (const row of PAGES) {
          const saved = r.data.data[row.pageKey] || {}
          map[row.pageKey] = { title: saved.title || '', description: saved.description || '', keywords: saved.keywords || '' }
        }
        setOverrides(map)
      })
      .catch(() => toast.error('Failed to load SEO settings'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading || !overrides) {
    return (
      <div className="p-7 space-y-4">
        {Array(3).fill(null).map((_, i) => <div key={i} className="shimmer h-40 rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div>
      <header className="flex items-center justify-between px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>SEO</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Edit the title, description, and keywords search engines see for each page. Leave a field blank to use the page's built-in default.
          </p>
        </div>
        <button onClick={load} className="btn-ghost btn-sm gap-2"><RotateCcw size={13} /> Reload</button>
      </header>

      <div className="p-7 grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-6xl">
        {PAGES.map(row => (
          <SeoRowCard
            key={row.pageKey}
            row={row}
            initial={overrides[row.pageKey] || EMPTY}
            onSaved={v => setOverrides(prev => ({ ...(prev || {}), [row.pageKey]: v }))}
          />
        ))}
      </div>
    </div>
  )
}
