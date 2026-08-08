'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  SlidersHorizontal, Grid3X3, ChevronDown, X,
  Search, MapPin, Bed, Bath, Maximize2, ArrowUpDown, Filter,
  Building2, Home, Castle, Layers, Store, LayoutGrid, TreePine,
  TrendingUp, Eye, Users, Flame, ShieldCheck, Star,
  ArrowRight, Bell, Sparkles, BadgeCheck, Map as MapIcon, Loader2,
  Tag, DollarSign, LayoutList,
} from 'lucide-react'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import PropertyCard from '@/components/buyer/PropertyCard'
import RecentlyViewedCard from '@/components/buyer/RecentlyViewedCard'
import SearchAutocomplete from '@/components/buyer/SearchAutocomplete'
import { propertyAPI, savedSearchAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Property, PropertyFilters } from '@/types'
import type { MapBounds } from '@/components/buyer/PropertiesMapView'
import { cn, formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

// Leaflet touches `window` at import time — must never run during Next's
// server render of this (client) page.
const PropertiesMapView = dynamic(() => import('@/components/buyer/PropertiesMapView'), {
  ssr: false,
  loading: () => <div className="shimmer rounded-2xl" style={{ height: 600 }} />,
})

/* ─── DATA ──────────────────────────────────────────────────── */
const TYPES = [
  { v: '',           l: 'All Types',   icon: LayoutGrid  },
  { v: 'apartment',  l: 'Apartment',   icon: Building2   },
  { v: 'villa',      l: 'Villa',       icon: Home        },
  { v: 'penthouse',  l: 'Penthouse',   icon: Castle      },
  { v: 'townhouse',  l: 'Townhouse',   icon: Layers      },
  { v: 'studio',     l: 'Studio',      icon: LayoutGrid  },
  { v: 'office',     l: 'Office',      icon: Store       },
  { v: 'plot',       l: 'Plot',        icon: TreePine    },
]

const SORT_OPTIONS = [
  { v: 'newest',    l: 'Newest First'      },
  { v: 'price_asc', l: 'Price: Low → High' },
  { v: 'price_desc',l: 'Price: High → Low' },
  { v: 'popular',   l: 'Most Popular'      },
  { v: 'area_asc',  l: 'Area: Smallest'    },
  { v: 'area_desc', l: 'Area: Largest'     },
]

const AREAS = [
  'Downtown Dubai','Dubai Marina','Palm Jumeirah','Business Bay','JBR',
  'DIFC','Arabian Ranches','Dubai Hills','MBR City','Jumeirah','Al Barsha',
  'Deira','Bur Dubai','Silicon Oasis','Sports City','JVC','JLT','Al Furjan',
]

const BEDS   = ['Studio','1','2','3','4','5','6+']
const PRICES = [
  { l:'Any',        min:0,         max:0          },
  { l:'<500K',      min:0,         max:500000     },
  { l:'500K–1M',    min:500000,    max:1000000    },
  { l:'1M–2M',      min:1000000,   max:2000000    },
  { l:'2M–5M',      min:2000000,   max:5000000    },
  { l:'5M–10M',     min:5000000,   max:10000000   },
  { l:'>10M',       min:10000000,  max:0          },
]

const TRENDING_AREAS = [
  { name: 'Dubai Marina',   pct: '+18%', listings: 356 },
  { name: 'JVC',            pct: '+24%', listings: 210 },
  { name: 'Business Bay',   pct: '+12%', listings: 284 },
  { name: 'Dubai Hills',    pct: '+31%', listings: 145 },
]

const SPONSORED = [
  { title: 'Marina Gate Tower',     area: 'Dubai Marina',  price: 'AED 2.85M', tag: 'Sponsored' },
  { title: 'Hills Estate Villa',    area: 'Dubai Hills',   price: 'AED 7.2M',  tag: 'Sponsored' },
]

/* ─── PILL BUTTON ───────────────────────────────────────────── */
function Pill({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn('rounded-lg text-xs font-medium border transition-all', className)}
      style={{
        borderColor: active ? 'var(--teal)' : 'var(--border)',
        background:  active ? 'rgba(49,178,222,0.10)' : 'transparent',
        color:       active ? 'var(--teal)' : 'var(--text-muted)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

/* ─── FILTER DROPDOWN (horizontal filter-bar pill, Bayut-style) ───────── */
function FilterDropdown({
  label, icon: Icon, active, widthClass = 'w-56', align = 'left', children,
}: {
  label: string; icon?: any; active?: boolean; widthClass?: string; align?: 'left' | 'right'
  children: (close: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-10 px-3.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all"
        style={{
          borderColor: open || active ? 'var(--teal)' : 'var(--border)',
          background:  open || active ? 'rgba(49,178,222,0.08)' : 'var(--surface)',
          color:       open || active ? 'var(--teal)' : 'var(--text-mid)',
        }}
      >
        {Icon && <Icon size={13} />}
        {label}
        <ChevronDown size={11} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className={cn('absolute top-full mt-2 z-40 rounded-xl shadow-lg p-3.5', widthClass, align === 'right' ? 'right-0' : 'left-0')}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DropdownOption({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
      style={{ background: active ? 'rgba(49,178,222,0.08)' : 'transparent', color: active ? 'var(--teal)' : 'var(--text-mid)' }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-alt)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

function DropdownLink({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
      style={{ background: active ? 'rgba(49,178,222,0.08)' : 'transparent', color: active ? 'var(--teal)' : 'var(--text-mid)' }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-alt)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {children}
    </Link>
  )
}

/* ─── HERO ──────────────────────────────────────────────────── */
function Hero({ q, setQ, total, heading, onSearch, onSelectArea, onSelectProject, onAISearch }: {
  q: string; setQ: (v: string) => void; total: number; heading: React.ReactNode; onSearch: () => void
  onSelectArea: (area: string) => void; onSelectProject: (project: string) => void
  onAISearch: (filters: PropertyFilters) => void
}) {
  const [aiSearching, setAiSearching] = useState(false)

  const askAI = async () => {
    if (!q.trim()) { toast.error('Type what you\'re looking for first'); return }
    setAiSearching(true)
    try {
      const res = await propertyAPI.aiSearch(q.trim())
      if (res.data.success) {
        const filters = res.data.data.filters as PropertyFilters
        onAISearch(filters)
        const parts = [
          filters.bedrooms !== undefined && `${filters.bedrooms}BR`,
          filters.type,
          filters.listingType && `for ${filters.listingType}`,
          filters.area && `in ${filters.area}`,
          filters.priceMax && `up to ${formatPrice(filters.priceMax)}`,
        ].filter(Boolean)
        toast.success(parts.length ? `Searching: ${parts.join(' ')}` : 'Searching by your description')
      }
    } catch (err: any) {
      toast.error(err?.error || 'AI search is unavailable right now')
    } finally {
      setAiSearching(false)
    }
  }
  return (
    <section className="relative overflow-hidden pt-10 pb-16">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(145deg, var(--bg) 0%, var(--bg-alt) 60%, #EFF6FF 100%)' }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(49,178,222,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(49,178,222,0.7) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{ top: '5%', right: '5%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(49,178,222,0.12) 0%, transparent 70%)' }}
      />
      <div
        className="absolute pointer-events-none"
        style={{ bottom: '-10%', left: '0%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(97,187,77,0.10) 0%, transparent 70%)' }}
      />

      <div className="wrap relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-5"
          style={{ background: 'rgba(49,178,222,0.08)', border: '1px solid rgba(49,178,222,0.25)', borderRadius: 24, padding: '6px 16px' }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--teal)', animation: 'pulseRing 2s infinite' }} />
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--teal)' }}>
            {total.toLocaleString()}+ Verified Listings Live
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5 }}
          className="heading-xl mb-4 max-w-2xl"
        >
          {heading}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.5 }}
          className="text-base max-w-xl mb-8 leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          Browse verified apartments, villas, and penthouses — updated daily with real-time pricing and availability.
        </motion.p>

        {/* Quick search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-xl"
        >
          <form
            onSubmit={e => { e.preventDefault(); onSearch() }}
            className="input-glass flex items-center gap-2 h-14 px-5 rounded-2xl" style={{ boxShadow: 'var(--shadow-md)' }}
          >
            <Search size={18} style={{ color: 'var(--teal)', flexShrink: 0 }} />
            <SearchAutocomplete
              value={q}
              onChange={setQ}
              onSubmit={onSearch}
              onSelectArea={onSelectArea}
              onSelectProject={onSelectProject}
              placeholder="Search by project, area, or developer…"
              inputClassName="bg-transparent flex-1 text-sm outline-none w-full"
              inputStyle={{ color: 'var(--text)' }}
            />
            <button
              type="button" onClick={askAI} disabled={aiSearching}
              className="btn-ghost btn-sm flex-shrink-0 gap-1.5" style={{ color: '#A855F7' }}
              title="Describe what you want in plain words"
            >
              {aiSearching ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              Ask AI
            </button>
            <button type="submit" className="btn-primary btn-sm flex-shrink-0">Search</button>
          </form>
        </motion.div>
        <p className="text-xs mt-2.5" style={{ color: 'var(--text-muted)' }}>
          Try "Ask AI" with something like <em>"2BR apartment in Marina under 2 million"</em>
        </p>

        {/* Quick stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-8 mt-8"
        >
          {[
            { Icon: ShieldCheck, label: 'Verified & Vetted' },
            { Icon: Users,       label: '12,000+ Buyers Matched' },
            { Icon: Flame,       label: '340 Properties Viewed Today' },
          ].map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              <Icon size={16} style={{ color: 'var(--teal)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-mid)' }}>{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ─── SIDEBAR: TRENDING AREAS ────────────────────────────────── */
function TrendingAreasCard() {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(49,178,222,0.10)', border: '1px solid rgba(49,178,222,0.20)' }}
        >
          <TrendingUp size={15} style={{ color: 'var(--teal)' }} />
        </div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Trending Areas</h3>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Most searched this week</p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {TRENDING_AREAS.map((a, i) => (
          <Link
            key={a.name}
            href={`/buyer/properties?area=${encodeURIComponent(a.name)}`}
            className="flex items-center justify-between py-2.5 px-2 rounded-lg transition-colors group"
            style={{}}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(49,178,222,0.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: 'var(--bg-alt)', color: 'var(--text-muted)' }}
              >
                {i + 1}
              </span>
              <div>
                <p className="text-xs font-medium transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>{a.name}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{a.listings} listings</p>
              </div>
            </div>
            <span className="text-xs font-semibold" style={{ color: 'var(--green)' }}>{a.pct}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ─── SIDEBAR: SPONSORED PROPERTY ADS ───────────────────────── */
function SponsoredCard() {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(168,85,247,0.10)', border: '1px solid rgba(168,85,247,0.20)' }}
          >
            <Sparkles size={15} style={{ color: '#A855F7' }} />
          </div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Featured Listings</h3>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {SPONSORED.map(s => (
          <Link
            key={s.title}
            href="#"
            className="flex gap-3 p-2.5 rounded-xl transition-colors group"
            style={{ border: '1px solid var(--border)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(49,178,222,0.40)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
          >
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--bg-alt)' }}
            >
              <Building2 size={22} style={{ color: 'var(--teal)', opacity: 0.4 }} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="badge badge-purple text-[9px] mb-1">{s.tag}</span>
              <p className="text-xs font-semibold leading-snug truncate transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>{s.title}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.area}</p>
              <p className="text-xs font-bold grad-text mt-0.5">{s.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ─── SIDEBAR: SAVE SEARCH + ALERTS ──────────────────────────── */
function describeFilters(filters: PropertyFilters): string {
  const parts: string[] = []
  if (filters.bedrooms) parts.push(`${filters.bedrooms}BR`)
  if (filters.type) parts.push(filters.type)
  parts.push(filters.listingType === 'rent' ? 'for Rent' : 'for Sale')
  if (filters.area) parts.push(`in ${filters.area}`)
  return parts.join(' ') || 'All Properties'
}

function AlertCard({ filters }: { filters: PropertyFilters }) {
  const { isAuthenticated } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const saveSearch = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in as a buyer to save searches and get alerts')
      return
    }
    setSaving(true)
    try {
      const clean: any = {}
      Object.entries(filters).forEach(([k, v]) => { if (v && k !== 'page' && k !== 'limit' && k !== 'sortBy') clean[k] = v })
      await savedSearchAPI.create({ name: describeFilters(filters), filters: clean })
      setSaved(true)
      toast.success("Saved — we'll notify you when a new match goes live")
    } catch (err: any) {
      toast.error(err?.error || 'Failed to save search')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card p-5 relative overflow-hidden" style={{ background: 'var(--grad)', border: 'none' }}>
      <div className="absolute pointer-events-none" style={{ top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
      <div className="relative z-10">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.18)' }}>
          <Bell size={16} className="text-white" />
        </div>
        <h3 className="font-semibold text-sm text-white mb-1">Get New Listing Alerts</h3>
        <p className="text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.82)' }}>
          Save this exact search — we'll notify you the moment a matching property goes live.
        </p>
        {saved ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-white font-medium">
              <BadgeCheck size={14} /> Search saved!
            </div>
            <Link href="/buyer/searches" className="text-[11px] underline" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Manage saved searches
            </Link>
          </div>
        ) : (
          <button
            onClick={saveSearch}
            disabled={saving}
            className="w-full py-2.5 rounded-lg text-xs font-bold transition-all"
            style={{ background: '#fff', color: 'var(--teal)' }}
          >
            {saving ? 'Saving…' : isAuthenticated ? 'Save This Search' : 'Sign In to Save'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── SIDEBAR: TESTIMONIAL / SOCIAL PROOF ───────────────────── */
function TestimonialCard() {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={13} fill="#FBBF24" stroke="#FBBF24" />
        ))}
      </div>
      <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-mid)' }}>
        "Found our dream apartment in Marina within a week. The verified listings saved us so much time."
      </p>
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
          style={{ background: 'var(--grad)' }}
        >
          NK
        </div>
        <div>
          <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Nadia K.</p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Bought in Dubai Marina</p>
        </div>
      </div>
    </div>
  )
}

/* ─── EMPTY STATE ───────────────────────────────────────────── */
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(49,178,222,0.08)', border: '1px solid rgba(49,178,222,0.20)' }}
      >
        <Search size={24} style={{ color: 'var(--teal)' }} />
      </div>
      <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>No properties found</h3>
      <p className="muted mb-6 max-w-xs">Try adjusting your filters or search in a different area.</p>
      <button onClick={onClear} className="btn-primary btn-sm">Clear Filters</button>
    </div>
  )
}

/* ─── MAIN PAGE ─────────────────────────────────────────────── */
// Buy and Rent each live at their own URL (/for-sale, /for-rent) rather than
// as tabs on one shared page — forcedListingType pins this instance to one
// purpose; when absent (plain /buyer/properties, used by older internal
// links) the Purpose filter still lets buyers jump to either dedicated page.
export default function PropertiesListClient({ forcedListingType }: { forcedListingType?: 'sale' | 'rent' }) {
  const searchParams = useSearchParams()

  const [properties, setProperties] = useState<Property[]>([])
  const [total,      setTotal]      = useState(2400)
  const [totalPages, setTotalPages] = useState(1)
  const [loading,    setLoading]    = useState(true)
  const [view,       setView]       = useState<'grid'|'list'|'map'>('list')
  const [heroQuery,  setHeroQuery]  = useState(searchParams.get('q') || '')
  const [mapProperties, setMapProperties] = useState<Property[]>([])
  const [mapLoading,    setMapLoading]    = useState(false)

  const [filters, setFilters] = useState<PropertyFilters>({
    listingType: forcedListingType || searchParams.get('listingType') || '',
    type:        searchParams.get('type')        || '',
    q:           searchParams.get('q')           || '',
    area:        searchParams.get('area')        || '',
    community:   searchParams.get('community')   || '',
    bedrooms:    searchParams.get('bedrooms')    || '',
    priceMin:    Number(searchParams.get('priceMin')) || 0,
    priceMax:    Number(searchParams.get('priceMax')) || 0,
    sortBy:      searchParams.get('sortBy')      || 'newest',
    page:        Number(searchParams.get('page')) || 1,
    limit:       12,
  })

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    try {
      const clean: any = {}
      Object.entries(filters).forEach(([k, v]) => { if (v) clean[k] = v })
      const res = await propertyAPI.getAll(clean)
      if (res.data.success) {
        setProperties(res.data.data.data)
        setTotal(res.data.data.total)
        setTotalPages(res.data.data.totalPages)
      }
    } catch {
      setProperties(Array(12).fill(null))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchProperties() }, [fetchProperties])

  // Map view fetches a bigger, unpaginated batch (up to 200 pins) using the
  // same non-geo filters as the grid/list views — bounds are only added once
  // the buyer explicitly hits "Search This Area", not on every pan/zoom.
  const fetchMapProperties = useCallback(async (bounds?: MapBounds) => {
    setMapLoading(true)
    try {
      const clean: any = {}
      Object.entries(filters).forEach(([k, v]) => { if (v && k !== 'page' && k !== 'limit') clean[k] = v })
      if (bounds) Object.assign(clean, bounds)
      const res = await propertyAPI.getAll({ ...clean, limit: 200 })
      if (res.data.success) setMapProperties(res.data.data.data)
    } catch {
      toast.error('Failed to load map listings')
    } finally {
      setMapLoading(false)
    }
  }, [filters])

  useEffect(() => { if (view === 'map') fetchMapProperties() }, [view, fetchMapProperties])

  const setFilter = (key: keyof PropertyFilters, val: any) => {
    setFilters(f => ({ ...f, [key]: val, page: 1 }))
  }

  // AI search replaces the whole filter set (not merges into whatever was
  // there before) — a fresh natural-language query describes a fresh intent,
  // and leftover manual filters from an earlier search would silently narrow
  // results in a way the buyer never asked for. If this page is pinned to a
  // purpose (/for-sale or /for-rent) that purpose wins over whatever the AI
  // inferred, since the buyer is already standing on a purpose-specific page.
  const applyAIFilters = (parsed: PropertyFilters) => {
    setFilters({
      listingType: forcedListingType || parsed.listingType || '',
      type: parsed.type || '',
      q: parsed.q || '',
      area: parsed.area || '',
      bedrooms: parsed.bedrooms !== undefined ? String(parsed.bedrooms) : '',
      priceMin: parsed.priceMin || 0,
      priceMax: parsed.priceMax || 0,
      sortBy: 'newest',
      page: 1,
      limit: 12,
    })
    setHeroQuery(parsed.q || '')
  }

  const clearFilters = () => {
    setFilters(f => ({
      ...f, type: '', q: '', area: '', bedrooms: '',
      priceMin: 0, priceMax: 0, sortBy: 'newest', page: 1,
    }))
    setHeroQuery('')
  }

  const activeCount = [
    filters.type, filters.area, filters.bedrooms, filters.priceMin,
  ].filter(Boolean).length

  const purposeLabel = filters.listingType === 'rent' ? 'Rent' : filters.listingType === 'sale' ? 'Buy' : 'Buy / Rent'
  const heroHeading = filters.listingType === 'rent'
    ? <>Find Your Next <span className="grad-text">Rental</span> in Dubai</>
    : <>Find Your Next <span className="grad-text">Property</span> in Dubai</>

  return (
    <div className="page">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────── */}
      <Hero
        q={heroQuery} setQ={setHeroQuery} total={total} heading={heroHeading}
        onSearch={() => setFilter('q', heroQuery)}
        onSelectArea={area => { setHeroQuery(''); setFilter('area', area) }}
        onSelectProject={project => { setHeroQuery(project); setFilter('q', project) }}
        onAISearch={applyAIFilters}
      />

      {/* ── Bayut-style horizontal filter bar ───────────────── */}
      <div className="sticky top-16 z-30" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="wrap py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Purpose — Buy / Rent are separate pages */}
            <FilterDropdown label={purposeLabel} icon={Tag} active widthClass="w-40">
              {() => (
                <div className="flex flex-col gap-1">
                  <DropdownLink href="/for-sale" active={filters.listingType === 'sale'}>Buy</DropdownLink>
                  <DropdownLink href="/for-rent" active={filters.listingType === 'rent'}>Rent</DropdownLink>
                </div>
              )}
            </FilterDropdown>

            {/* Property type */}
            <FilterDropdown label={TYPES.find(t => t.v === filters.type)?.l || 'Property Type'} icon={Home} active={!!filters.type} widthClass="w-52">
              {close => (
                <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
                  {TYPES.map(t => (
                    <DropdownOption key={t.v} active={filters.type === t.v} onClick={() => { setFilter('type', t.v); close() }}>
                      {t.l}
                    </DropdownOption>
                  ))}
                </div>
              )}
            </FilterDropdown>

            {/* Bedrooms */}
            <FilterDropdown label={filters.bedrooms ? `${filters.bedrooms === 'Studio' ? 'Studio' : filters.bedrooms + ' BR'}` : 'Bedrooms'} icon={Bed} active={!!filters.bedrooms} widthClass="w-48">
              {() => (
                <div className="flex flex-wrap gap-1.5">
                  {BEDS.map(b => (
                    <Pill key={b} active={filters.bedrooms === b} onClick={() => setFilter('bedrooms', filters.bedrooms === b ? '' : b)} className="px-2.5 py-1.5">
                      {b === 'Studio' ? 'Studio' : `${b} BR`}
                    </Pill>
                  ))}
                </div>
              )}
            </FilterDropdown>

            {/* Price */}
            <FilterDropdown label={PRICES.find(p => p.min === filters.priceMin && p.max === filters.priceMax && (p.min || p.max))?.l || 'Price'} icon={DollarSign} active={!!filters.priceMin || !!filters.priceMax} widthClass="w-48">
              {close => (
                <div className="flex flex-col gap-1">
                  {PRICES.map(p => (
                    <DropdownOption key={p.l} active={filters.priceMin === p.min && filters.priceMax === p.max} onClick={() => { setFilter('priceMin', p.min); setFilter('priceMax', p.max); close() }}>
                      {p.l}
                    </DropdownOption>
                  ))}
                </div>
              )}
            </FilterDropdown>

            {/* Area */}
            <FilterDropdown label={filters.area || 'Area'} icon={MapPin} active={!!filters.area} widthClass="w-56">
              {close => (
                <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
                  <DropdownOption active={!filters.area} onClick={() => { setFilter('area', ''); close() }}>Any Area</DropdownOption>
                  {AREAS.map(a => (
                    <DropdownOption key={a} active={filters.area === a} onClick={() => { setFilter('area', a); close() }}>{a}</DropdownOption>
                  ))}
                </div>
              )}
            </FilterDropdown>

            {/* More filters — Completion + Furnishing */}
            <FilterDropdown label="More Filters" icon={SlidersHorizontal} active={!!(filters as any).completion || !!(filters as any).furnishing} widthClass="w-64" align="right">
              {close => (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Completion</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[{ v: '', l: 'All' }, { v: 'ready', l: 'Ready' }, { v: 'off_plan', l: 'Off-Plan' }].map(o => (
                        <Pill key={o.v} active={(filters as any).completion === o.v} onClick={() => setFilter('completion' as any, o.v)} className="py-1.5">{o.l}</Pill>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Furnishing</p>
                    <div className="flex flex-col gap-1.5">
                      {[{ v: '', l: 'Any' }, { v: 'furnished', l: 'Furnished' }, { v: 'semi_furnished', l: 'Semi Furnished' }, { v: 'unfurnished', l: 'Unfurnished' }].map(o => (
                        <Pill key={o.v} active={(filters as any).furnishing === o.v} onClick={() => setFilter('furnishing' as any, o.v)} className="py-1.5 px-3 text-left">{o.l}</Pill>
                      ))}
                    </div>
                  </div>
                  <button onClick={close} className="btn-primary btn-sm w-full">Done</button>
                </div>
              )}
            </FilterDropdown>

            {activeCount > 0 && (
              <button onClick={clearFilters} className="text-xs flex-shrink-0 px-2" style={{ color: 'var(--text-muted)' }}>Clear all</button>
            )}
          </div>

          {/* Sort + View toggle */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="relative hidden sm:block">
              <select
                value={filters.sortBy}
                onChange={e => setFilter('sortBy', e.target.value)}
                className="select-field appearance-none pr-9 py-2 text-xs cursor-pointer min-w-[150px]"
              >
                {SORT_OPTIONS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
              <ArrowUpDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {(['list','grid','map'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="p-2 transition-colors"
                  title={v === 'map' ? 'Map view' : v === 'list' ? 'List view' : 'Grid view'}
                  style={{
                    background: view === v ? 'rgba(49,178,222,0.10)' : 'transparent',
                    color:      view === v ? 'var(--teal)' : 'var(--text-muted)',
                  }}
                >
                  {v === 'grid' ? <Grid3X3 size={15} /> : v === 'list' ? <LayoutList size={15} /> : <MapIcon size={15} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Results header ───────────────────────────────── */}
      <div className="wrap pt-6 pb-2">
        <h2 className="heading-md mb-1">
          Properties for{' '}
          <span className="grad-text">{filters.listingType === 'rent' ? 'Rent' : 'Sale'}</span>
          {filters.area && <span style={{ color: 'var(--text-muted)' }} className="text-xl"> · {filters.area}</span>}
        </h2>
        <p className="muted">
          {loading ? 'Loading…' : `${total.toLocaleString()} properties found`}
        </p>
      </div>

      {/* ── Grid + Right rail ────────────────────────────── */}
      <div className="wrap pb-20 pt-4">
        <div className="flex gap-6">

          {/* ── Center: Properties list ─────────────────────── */}
          <div className="flex-1 min-w-0">
            {view === 'map' ? (
              <PropertiesMapView
                properties={mapProperties}
                searching={mapLoading}
                onSearchThisArea={bounds => fetchMapProperties(bounds)}
              />
            ) : loading ? (
              <div className={cn(view === 'grid' ? 'grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-4')}>
                {Array(9).fill(null).map((_, i) => (
                  <PropertyCard key={i} property={undefined} loading layout={view === 'grid' ? 'grid' : 'row'} />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <EmptyState onClear={clearFilters} />
            ) : (
              <>
                <div className={cn(view === 'grid' ? 'grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-4')}>
                  {properties.map((p, i) => (
                    <motion.div key={p?._id || i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}>
                      <PropertyCard property={p} loading={!p} layout={view === 'grid' ? 'grid' : 'row'} />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setFilter('page', p)}
                        className="w-9 h-9 rounded-lg text-sm font-medium border transition-all"
                        style={{
                          borderColor: filters.page === p ? 'var(--teal)' : 'var(--border)',
                          background:  filters.page === p ? 'rgba(49,178,222,0.10)' : 'transparent',
                          color:       filters.page === p ? 'var(--teal)' : 'var(--text-muted)',
                        }}
                      >
                        {p}
                      </button>
                    ))}
                    {totalPages > 7 && <span className="text-sm" style={{ color: 'var(--text-muted)' }}>…{totalPages}</span>}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Right: Sidebar (ads + buying behavior) ────── */}
          <aside className="hidden xl:flex flex-col gap-5 flex-shrink-0 w-[300px]">
            <div className="sticky top-20 flex flex-col gap-5">
              <AlertCard filters={filters} />
              <RecentlyViewedCard />
              <TrendingAreasCard />
              <SponsoredCard />
              <TestimonialCard />
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  )
}
