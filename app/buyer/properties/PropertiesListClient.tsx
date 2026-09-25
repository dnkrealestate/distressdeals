'use client'
import { useState, useEffect, useLayoutEffect, useCallback, useRef, Suspense, Fragment } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  Grid3X3, ChevronDown, ChevronRight,
  Search, ArrowUpDown, Building2,
  TrendingUp, Star,
  Bell, Sparkles, BadgeCheck, Map as MapIcon,
  LayoutList,
} from 'lucide-react'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import PropertyCard from '@/components/buyer/PropertyCard'
import RecentlyViewedCard from '@/components/buyer/RecentlyViewedCard'
import TrendingAreasCard from '@/components/buyer/TrendingAreasCard'
import AdSlot from '@/components/shared/AdSlot'
import ProjectCard from '@/components/buyer/ProjectCard'
import ProjectCompareBar from '@/components/buyer/ProjectCompareBar'
import Pagination from '@/components/shared/Pagination'
import SearchBar from '@/components/buyer/SearchBar'
import { PropertyFilterBar, Pill, FilterDropdown, DropdownOption, TYPES } from '@/components/buyer/PropertyFilterBar'
import { propertyAPI, savedSearchAPI, projectAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Property, PropertyFilters, Project } from '@/types'
import type { MapPin } from '@/lib/mapPins'
import type { MapBounds } from '@/lib/googleMaps'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// Loaded client-side only — the Maps script needs `window`.
const PropertiesMapView = dynamic(() => import('@/components/buyer/PropertiesGoogleMapView'), {
  ssr: false,
  loading: () => <div className="shimmer rounded-2xl" style={{ height: 600 }} />,
})

/* ─── DATA ──────────────────────────────────────────────────── */
// Property type/area/bedroom/price vocab and the Pill/FilterDropdown/etc.
// building blocks now live in PropertyFilterBar.tsx, shared with the
// map-search page.
const SORT_OPTIONS = [
  { v: 'recommended', l: 'Recommended'     },
  { v: 'newest',    l: 'Newest First'      },
  { v: 'price_asc', l: 'Price: Low → High' },
  { v: 'price_desc',l: 'Price: High → Low' },
  { v: 'popular',   l: 'Most Popular'      },
  { v: 'area_asc',  l: 'Area: Smallest'    },
  { v: 'area_desc', l: 'Area: Largest'     },
]

/* ─── SIDEBAR: SAVE SEARCH + ALERTS ──────────────────────────── */
function describeFilters(filters: PropertyFilters): string {
  const parts: string[] = []
  if (filters.bedrooms) parts.push(`${filters.bedrooms}BR`)
  if (filters.type) parts.push(filters.type)
  parts.push(filters.listingType === 'rent' ? 'for Rent' : 'for Sale')
  if (filters.area) parts.push(`in ${filters.area}`)
  if (filters.rentalStatus === 'available_now') parts.push('available now')
  else if (filters.availableWithin) parts.push(`available within ${filters.availableWithin} days`)
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

/* ─── SORT + VIEW TOGGLE (shared by the filter bar and the normal-time
   counts row, so switching between them never costs the buyer these
   controls) ─────────────────────────────────────────────────── */
function SortViewControls({
  sortBy, onSortChange, view, onViewChange,
}: {
  sortBy: string; onSortChange: (v: string) => void
  view: 'grid' | 'list' | 'map'; onViewChange: (v: 'grid' | 'list' | 'map') => void
}) {
  return (
    <div className="flex items-center gap-2.5 flex-shrink-0">
      <div className="relative hidden sm:block">
        <select
          value={sortBy}
          onChange={e => onSortChange(e.target.value)}
          className="select-field appearance-none pr-9 py-2 text-xs cursor-pointer min-w-[150px]"
        >
          {SORT_OPTIONS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
        <ArrowUpDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
      </div>
      <div className="flex rounded-lg overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--border)' }}>
        {(['list', 'grid', 'map'] as const).map(v => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            // List view is redundant on mobile — the row card already
            // stacks to a single column there, so only Grid + Map show.
            className={cn('p-2 transition-colors', v === 'list' && 'hidden sm:inline-flex')}
            title={v === 'map' ? 'Map view' : v === 'list' ? 'List view' : 'Grid view'}
            style={{
              background: view === v ? 'rgba(203,1,1,0.10)' : 'transparent',
              color:      view === v ? 'var(--teal)' : 'var(--text-muted)',
            }}
          >
            {v === 'grid' ? <Grid3X3 size={15} /> : v === 'list' ? <LayoutList size={15} /> : <MapIcon size={15} />}
          </button>
        ))}
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
        style={{ background: 'rgba(203,1,1,0.08)', border: '1px solid rgba(203,1,1,0.20)' }}
      >
        <Search size={24} style={{ color: 'var(--teal)' }} />
      </div>
      <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>No properties found</h3>
      <p className="muted mb-6 max-w-xs">Try adjusting your filters or search in a different area.</p>
      <button onClick={onClear} className="btn-primary btn-sm">Clear Filters</button>
    </div>
  )
}

/* ─── PROPERTIES + NEW PROJECTS IN ONE LIST ─────────────────── */
// On the Buy page, off-plan projects sit in the same list as resale listings. Projects only come in residential
// types and never for rent, and they can't be matched on bedrooms/size/availability — skip them for those searches.
// 40 listings a page; up to 10 new projects mixed in.
const PER_PAGE = 40
const PROJECTS_PER_PAGE = 10
const PROJECT_TYPES = ['apartment', 'villa', 'townhouse', 'penthouse', 'studio']

function projectsApply(f: PropertyFilters, forced?: 'sale' | 'rent'): boolean {
  if (forced === 'rent' || f.listingType === 'rent') return false
  if (f.category && f.category !== 'residential') return false
  if (f.type && !PROJECT_TYPES.includes(f.type)) return false
  return !f.bedrooms && !f.bathrooms && !f.sizeMin && !f.sizeMax && !f.rentalStatus && !f.availableWithin
}

const PROJECT_STATUS_FOR: Record<string, string> = { ready: 'ready', off_plan: 'upcoming,under_construction' }

const COMPLETION_TABS = [
  { v: '', l: 'All' },
  { v: 'ready', l: 'Ready' },
  { v: 'off_plan', l: 'Off-Plan' },
]

type ListItem = { kind: 'property'; item: Property; key: string } | { kind: 'project'; item: Project; key: string }

// Price/newest sorts keep their order across both kinds; otherwise one project after every three listings.
function mixListings(properties: Property[], projects: Project[], sortBy: string): ListItem[] {
  const props: ListItem[] = properties.map((p, i) => ({ kind: 'property', item: p, key: p?._id || `p${i}` }))
  const projs: ListItem[] = projects.map(p => ({ kind: 'project', item: p, key: `proj-${p._id}` }))
  if (!projs.length) return props
  const price = (x: ListItem) => x.kind === 'property' ? x.item.price : x.item.priceFrom
  const created = (x: ListItem) => new Date(x.item.createdAt).getTime()
  if (sortBy === 'price_asc' || sortBy === 'price_desc' || sortBy === 'newest') {
    const key = sortBy === 'newest' ? (x: ListItem) => -created(x) : sortBy === 'price_asc' ? price : (x: ListItem) => -price(x)
    // Stable merge: properties keep the server's order among themselves.
    const out: ListItem[] = []; let i = 0, j = 0
    while (i < props.length || j < projs.length) {
      if (j >= projs.length || (i < props.length && key(props[i]) <= key(projs[j]))) out.push(props[i++]); else out.push(projs[j++])
    }
    return out
  }
  const out: ListItem[] = []; let j = 0
  props.forEach((p, i) => { out.push(p); if ((i + 1) % 3 === 0 && j < projs.length) out.push(projs[j++]) })
  while (j < projs.length) out.push(projs[j++])
  return out
}

/* ─── MAIN PAGE ─────────────────────────────────────────────── */
// Buy and Rent each live at their own URL (/for-sale, /for-rent) rather than
// as tabs on one shared page — forcedListingType pins this instance to one
// purpose; when absent (plain /buyer/properties, used by older internal
// links) the Purpose filter still lets buyers jump to either dedicated page.
interface PropertiesListClientProps {
  forcedListingType?: 'sale' | 'rent'
  // Server-fetched first page matching the page's default filters (see app/for-sale/page.tsx /
  // app/for-rent/page.tsx) — purely to seed the initial render so crawlers (and the first paint) see real
  // listings instead of an empty/loading state. The client still re-fetches on mount exactly as before; this
  // only changes what's visible before that re-fetch resolves.
  initialProperties?: Property[]
  initialTotal?: number
  initialTotalPages?: number
}

export default function PropertiesListClient(props: PropertiesListClientProps) {
  return (
    <Suspense fallback={null}>
      <PropertiesListClientInner {...props} />
    </Suspense>
  )
}

function PropertiesListClientInner({ forcedListingType, initialProperties, initialTotal, initialTotalPages }: PropertiesListClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [properties, setProperties] = useState<Property[]>(initialProperties || [])
  const [total,      setTotal]      = useState(initialTotal ?? 2400)
  const [totalPages, setTotalPages] = useState(initialTotalPages ?? 1)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectTotal, setProjectTotal] = useState(0)
  const [projectPages, setProjectPages] = useState(0)
  const [loading,    setLoading]    = useState(!initialProperties?.length)
  const [view,       setView]       = useState<'grid'|'list'|'map'>('list')

  // The List toggle button is hidden below the `sm` breakpoint (see
  // SortViewControls) — if a mobile visitor is sitting on the 'list'
  // default with no button left to change it, fall back to 'grid'.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const apply = () => setView(v => (mq.matches && v === 'list' ? 'grid' : v))
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  const [mapPins, setMapPins] = useState<MapPin[]>([])
  const [mapLoading,    setMapLoading]    = useState(false)

  const [filters, setFilters] = useState<PropertyFilters>({
    listingType: forcedListingType || searchParams.get('listingType') || '',
    type:        searchParams.get('type')        || '',
    q:           searchParams.get('q')           || '',
    area:        searchParams.get('area')        || '',
    community:   searchParams.get('community')   || '',
    bedrooms:    searchParams.get('bedrooms')    || '',
    category:    (searchParams.get('category') as any) || '',
    bathrooms:   searchParams.get('bathrooms')   || '',
    sizeMin:     Number(searchParams.get('sizeMin')) || 0,
    sizeMax:     Number(searchParams.get('sizeMax')) || 0,
    priceMin:    Number(searchParams.get('priceMin')) || 0,
    priceMax:    Number(searchParams.get('priceMax')) || 0,
    rentalStatus:   searchParams.get('rentalStatus') || '',
    availableWithin: Number(searchParams.get('availableWithin')) || 0,
    completion:  searchParams.get('completion')  || '',
    sortBy:      searchParams.get('sortBy')      || 'recommended',
    page:        Number(searchParams.get('page')) || 1,
    limit:       PER_PAGE,
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

  // New projects matching the same search, a few per page, mixed into the list below.
  useEffect(() => {
    if (!projectsApply(filters, forcedListingType)) { setProjects([]); setProjectTotal(0); setProjectPages(0); return }
    let cancelled = false
    const params: Record<string, any> = { page: filters.page || 1, limit: PROJECTS_PER_PAGE }
    if (filters.area) params.area = filters.area
    if (filters.community) params.community = filters.community
    if (filters.type) params.type = filters.type
    if (filters.q) params.q = filters.q
    if (filters.priceMin) params.priceMin = filters.priceMin
    if (filters.priceMax) params.priceMax = filters.priceMax
    if (filters.completion) params.status = PROJECT_STATUS_FOR[filters.completion]
    projectAPI.getAll(params)
      .then(r => {
        if (cancelled || !r.data.success) return
        setProjects(r.data.data.data || [])
        setProjectTotal(r.data.data.total || 0)
        setProjectPages(r.data.data.totalPages || 0)
      })
      .catch(() => { if (!cancelled) { setProjects([]); setProjectTotal(0); setProjectPages(0) } })
    return () => { cancelled = true }
  }, [filters, forcedListingType])

  const listItems = mixListings(properties, projects, filters.sortBy || 'recommended')
  const pageCount = Math.max(totalPages, projectPages)

  // PropertyFinder-style "Apartments 1,234 · Villas 567 …" counts row —
  // reflects every active filter EXCEPT the type filter itself (that's the
  // whole point: each pill shows how many results picking THAT type would
  // give from the current search, not just the currently-applied one).
  const [typeStats,      setTypeStats]      = useState<{ type: string; count: number }[]>([])
  const [typeStatsTotal, setTypeStatsTotal] = useState(0)

  const fetchTypeStats = useCallback(async () => {
    try {
      const { type, page, limit, sortBy, ...rest } = filters as any
      const clean: any = {}
      Object.entries(rest).forEach(([k, v]) => { if (v) clean[k] = v })
      // New projects are in the same list, so their types count too (same search, minus the type itself) — without
      // this the Off-Plan tab, which is mostly projects, would have no type pills at all.
      const withProjects = projectsApply({ ...filters, type: '' }, forcedListingType)
      const pParams: Record<string, any> = {}
      if (withProjects) {
        if (filters.area) pParams.area = filters.area
        if (filters.q) pParams.q = filters.q
        if (filters.priceMin) pParams.priceMin = filters.priceMin
        if (filters.priceMax) pParams.priceMax = filters.priceMax
        if (filters.completion) pParams.status = PROJECT_STATUS_FOR[filters.completion]
      }
      const [res, pRes] = await Promise.all([
        propertyAPI.getTypeStats(clean),
        withProjects ? projectAPI.getTypeStats(pParams).catch(() => null) : Promise.resolve(null),
      ])
      if (res.data.success) {
        const merged = new Map<string, number>()
        const add = (list: { type: string; count: number }[] = []) => list.forEach(s => merged.set(s.type, (merged.get(s.type) || 0) + s.count))
        add(res.data.data.stats)
        if (pRes?.data.success) add(pRes.data.data.stats)
        setTypeStats(Array.from(merged, ([type, count]) => ({ type, count })))
        setTypeStatsTotal(res.data.data.total + (pRes?.data.success ? pRes.data.data.total : 0))
      }
    } catch {
      // Non-critical — the counts row just stays empty if this fails.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.listingType, filters.q, filters.area, filters.community, filters.bedrooms,
    filters.priceMin, filters.priceMax, (filters as any).furnishing, (filters as any).completion,
    filters.rentalStatus, filters.availableWithin,
    filters.category, filters.bathrooms, filters.sizeMin, filters.sizeMax,
  ])

  useEffect(() => { fetchTypeStats() }, [fetchTypeStats])

  // Bayut-style behaviour: at normal scroll (search box still visible) the
  // type-count pills sit under the search box; once the search box scrolls
  // out of view, that row is replaced by the full horizontal filter bar
  // stuck to the top — never both at once, and the filter bar never
  // occupies space until it's actually needed.
  const searchWrapRef = useRef<HTMLDivElement>(null)
  const [pastSearch, setPastSearch] = useState(false)

  useEffect(() => {
    const el = searchWrapRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setPastSearch(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { rootMargin: '-64px 0px 0px 0px', threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // The homepage-style SearchBar rendered below navigates via router.push to
  // this same page's own URL (e.g. /for-sale?area=...) rather than mutating
  // state directly — when that happens while already mounted here, Next.js
  // reuses this component instance, so the `filters` state (only ever read
  // from the URL once, at the initial useState above) needs an explicit
  // re-sync whenever the URL's search params actually change.
  useEffect(() => {
    setFilters(f => ({
      ...f,
      listingType: forcedListingType || searchParams.get('listingType') || '',
      type:        searchParams.get('type')        || '',
      q:           searchParams.get('q')           || '',
      area:        searchParams.get('area')        || '',
      community:   searchParams.get('community')   || '',
      bedrooms:    searchParams.get('bedrooms')    || '',
      category:    (searchParams.get('category') as any) || '',
      bathrooms:   searchParams.get('bathrooms')   || '',
      sizeMin:     Number(searchParams.get('sizeMin')) || 0,
      sizeMax:     Number(searchParams.get('sizeMax')) || 0,
      priceMin:    Number(searchParams.get('priceMin')) || 0,
      priceMax:    Number(searchParams.get('priceMax')) || 0,
      rentalStatus:   searchParams.get('rentalStatus') || '',
      availableWithin: Number(searchParams.get('availableWithin')) || 0,
      completion:  searchParams.get('completion')  || '',
      page: 1,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  // Map view fetches a bigger, unpaginated batch (up to 200 pins) using the
  // same non-geo filters as the grid/list views — bounds are only added once
  // the buyer explicitly hits "Search This Area", not on every pan/zoom.
  const fetchMapProperties = useCallback(async (bounds?: MapBounds) => {
    setMapLoading(true)
    try {
      const clean: any = {}
      Object.entries(filters).forEach(([k, v]) => { if (v && k !== 'page' && k !== 'limit') clean[k] = v })
      if (bounds) Object.assign(clean, bounds)
      // Map pins include the new projects matching the same search, like the list does.
      const res = await propertyAPI.getMapPins(clean)
      if (res.data.success) setMapPins(res.data.data.pins)
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

  const clearFilters = () => {
    setFilters(f => ({
      ...f, type: '', q: '', area: '', bedrooms: '', category: '', bathrooms: '',
      sizeMin: 0, sizeMax: 0, priceMin: 0, priceMax: 0, sortBy: 'recommended', page: 1,
      furnishing: '', completion: '', rentalStatus: '', availableWithin: 0,
    }))
  }

  const activeCount = [
    filters.type, filters.area, filters.bedrooms, filters.priceMin,
    filters.category, filters.bathrooms, filters.sizeMin,
    filters.rentalStatus, filters.availableWithin, (filters as any).completion, (filters as any).furnishing,
  ].filter(Boolean).length

  // Type-count pills stay a single row on every screen size — but instead
  // of a fixed guess at how many fit, an offscreen measuring copy of every
  // pill (identical markup, so identical widths) is used to work out how
  // many ACTUALLY fit in the space left after the Sort/View controls, and
  // only that many render for real; whatever's left goes behind a "+N More"
  // popover (out of the flex flow, so opening it can never wrap the row).
  const visibleTypeDefs = TYPES.filter(t => t.v && typeStats.some(s => s.type === t.v && s.count > 0))

  const typeRowRef  = useRef<HTMLDivElement>(null)
  const sortViewRef = useRef<HTMLDivElement>(null)
  const measureRef  = useRef<HTMLDivElement>(null)
  const [visibleTypeCount, setVisibleTypeCount] = useState(visibleTypeDefs.length)

  useLayoutEffect(() => {
    const row = typeRowRef.current
    const measure = measureRef.current
    if (!row || !measure) return

    const GAP = 8 // matches gap-2 on the pills row
    const recompute = () => {
      const sortViewWidth = sortViewRef.current?.offsetWidth || 0
      const available = row.clientWidth - sortViewWidth - 12 // 12 = gap-3 between the two
      const children = Array.from(measure.children) as HTMLElement[]
      if (children.length < 2) { setVisibleTypeCount(visibleTypeDefs.length); return }

      const allTypesWidth = children[0].offsetWidth
      const moreWidth     = children[children.length - 1].offsetWidth
      const typeWidths    = children.slice(1, -1).map(el => el.offsetWidth)

      let total = allTypesWidth
      let fit = 0
      for (let i = 0; i < typeWidths.length; i++) {
        const remaining  = typeWidths.length - (i + 1)
        const reserveMore = remaining > 0 ? moreWidth + GAP : 0
        if (total + GAP + typeWidths[i] + reserveMore <= available) {
          total += GAP + typeWidths[i]
          fit = i + 1
        } else break
      }
      setVisibleTypeCount(fit)
    }

    recompute()
    const ro = new ResizeObserver(recompute)
    ro.observe(row)
    return () => ro.disconnect()
  }, [visibleTypeDefs.length, typeStatsTotal, pastSearch])

  const isRent = forcedListingType === 'rent' || filters.listingType === 'rent'
  const shownTypeDefs = visibleTypeDefs.slice(0, visibleTypeCount)
  const moreTypeDefs  = visibleTypeDefs.slice(visibleTypeCount)

  return (
    <div className="page">
      <Navbar />
      <ProjectCompareBar />

      {/* ── Breadcrumb + heading — sit above the search box, PropertyFinder-style ── */}
      <div className="wrap pt-8">
        <nav className="flex items-center gap-1.5 text-xs mb-3" style={{ color: 'var(--text-muted)' }} aria-label="Breadcrumb">
          <Link href="/" className="transition-colors hover:text-[var(--teal)]">Home</Link>
          <ChevronRight size={11} />
          <Link href={filters.listingType === 'rent' ? '/for-rent' : '/for-sale'} className="transition-colors hover:text-[var(--teal)]">
            {filters.listingType === 'rent' ? 'Rent' : 'Buy'}
          </Link>
          <ChevronRight size={11} />
          <span style={{ color: 'var(--text)' }}>Properties for {filters.listingType === 'rent' ? 'Rent' : 'Sale'}</span>
        </nav>

        <h1 className="heading-md mb-1">
          {forcedListingType === 'sale' ? (
            <>Distressed Property for <span className="grad-text">Sale</span> in Dubai</>
          ) : forcedListingType === 'rent' ? (
            <>Property for <span className="grad-text">Rent</span> in Dubai</>
          ) : (
            <>Properties for <span className="grad-text">{filters.listingType === 'rent' ? 'Rent' : 'Sale'}</span></>
          )}
          {filters.area && <span style={{ color: 'var(--text-muted)' }} className="text-xl"> · {filters.area}</span>}
        </h1>
        <p className="muted">
          {loading ? 'Loading…' : `${total.toLocaleString()} ${total === 1 ? 'property' : 'properties'}${projectTotal ? ` · ${projectTotal} new ${projectTotal === 1 ? 'project' : 'projects'}` : ''} found`}
        </p>
      </div>

      {/* ── SEARCH — same search box as the homepage, no big banner ── */}
      <div ref={searchWrapRef} className="wrap pt-6 pb-4">
        <SearchBar
          forcedListingType={forcedListingType}
          onMapClick={() => {
            const p = new URLSearchParams()
            Object.entries(filters).forEach(([k, v]) => {
              if (v && k !== 'page' && k !== 'limit' && k !== 'sortBy') p.set(k, String(v))
            })
            router.push(`/map-search${p.toString() ? `?${p.toString()}` : ''}`)
          }}
        />
      </div>

      {/* ── Bayut-style horizontal filter bar — only once the search box
          has scrolled out of view; the type-count row below covers this
          same ground while the search box is still on screen ── */}
      {pastSearch && (
      <motion.div
        initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.18 }}
        className="sticky top-16 z-30" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <div className="wrap py-3 flex items-center gap-3 flex-nowrap">
          <div className="flex-1 min-w-0">
            <PropertyFilterBar
              filters={filters} setFilter={setFilter} clearFilters={clearFilters} activeCount={activeCount}
              purposeHrefs={{ sale: '/for-sale', rent: '/for-rent' }}
            />
          </div>

          <SortViewControls
            sortBy={filters.sortBy || 'newest'} onSortChange={v => setFilter('sortBy', v)}
            view={view} onViewChange={setView}
          />
        </div>
      </motion.div>
      )}

      {/* ── Property-type counts row (PropertyFinder-style) — normal-time
          stand-in for the filter bar above, shown only while the search
          box is still visible. Sort + view-type controls stay available
          here too, so switching to the filter bar never gates them. ── */}
      {!pastSearch && (
        <div ref={typeRowRef} className="wrap pt-4 flex items-center justify-between gap-3">
          {/* Offscreen measuring copy — identical markup/classes to the real
              pills below, used only to read real rendered widths so the
              visible count can be computed exactly instead of guessed. */}
          {typeStats.length > 0 && (
            <div
              ref={measureRef}
              aria-hidden
              className="flex items-center gap-2 flex-nowrap"
              style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', top: -9999, left: 0 }}
            >
              <Pill active={false} onClick={() => {}} className="px-3.5 py-2 flex-shrink-0 whitespace-nowrap">
                All Types <span>&nbsp;{typeStatsTotal.toLocaleString()}</span>
              </Pill>
              {visibleTypeDefs.map(t => {
                const Icon  = t.icon
                const count = typeStats.find(s => s.type === t.v)?.count || 0
                return (
                  <Pill key={t.v} active={false} onClick={() => {}} className="px-3.5 py-2 flex-shrink-0 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon size={13} />
                      {t.l}
                      <span>{count.toLocaleString()}</span>
                    </span>
                  </Pill>
                )
              })}
              <button className="flex items-center gap-1.5 h-10 px-3.5 rounded-lg border text-xs font-semibold whitespace-nowrap">
                {`+${visibleTypeDefs.length} More`}
                <ChevronDown size={11} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 flex-nowrap flex-1 min-w-0" style={{ overflow: 'visible' }}>
            {typeStats.length > 0 && (
              <>
                <Pill
                  active={!filters.type}
                  onClick={() => setFilter('type', '')}
                  className="px-3.5 py-2 flex-shrink-0 whitespace-nowrap"
                >
                  All Types <span style={{ opacity: 0.55 }}>&nbsp;{typeStatsTotal.toLocaleString()}</span>
                </Pill>
                {shownTypeDefs.map(t => {
                  const Icon  = t.icon
                  const count = typeStats.find(s => s.type === t.v)?.count || 0
                  return (
                    <Pill
                      key={t.v}
                      active={filters.type === t.v}
                      onClick={() => setFilter('type', filters.type === t.v ? '' : t.v)}
                      className="px-3.5 py-2 flex-shrink-0 whitespace-nowrap"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Icon size={13} />
                        {t.l}
                        <span style={{ opacity: 0.55 }}>{count.toLocaleString()}</span>
                      </span>
                    </Pill>
                  )
                })}
                {/* "More" opens a popover (out of the flex flow) instead of
                    wrapping the rest inline — the row can never grow to a
                    second line, on desktop or mobile. */}
                {moreTypeDefs.length > 0 && (
                  <FilterDropdown label={`+${moreTypeDefs.length} More`} widthClass="w-48">
                    {close => (
                      <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
                        {moreTypeDefs.map(t => {
                          const count = typeStats.find(s => s.type === t.v)?.count || 0
                          return (
                            <DropdownOption
                              key={t.v}
                              active={filters.type === t.v}
                              onClick={() => { setFilter('type', filters.type === t.v ? '' : t.v); close() }}
                            >
                              {t.l} <span style={{ opacity: 0.55 }}>· {count.toLocaleString()}</span>
                            </DropdownOption>
                          )
                        })}
                      </div>
                    )}
                  </FilterDropdown>
                )}
              </>
            )}
          </div>

          <div ref={sortViewRef}>
            <SortViewControls
              sortBy={filters.sortBy || 'newest'} onSortChange={v => setFilter('sortBy', v)}
              view={view} onViewChange={setView}
            />
          </div>
        </div>
      )}

      {/* ── Grid + Right rail ────────────────────────────── */}
      <div className="wrap pb-20 pt-6">
        <div className="flex gap-6">

          {/* ── Center: Properties list ─────────────────────── */}
          <div className="flex-1 min-w-0">
            {forcedListingType !== 'rent' && filters.listingType !== 'rent' && (
              <div className="flex items-center gap-1 p-1 rounded-xl mb-5 w-full sm:w-auto sm:inline-flex" role="tablist" aria-label="Completion status"
                style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                {COMPLETION_TABS.map(t => {
                  const active = (filters.completion || '') === t.v
                  return (
                    <button key={t.v || 'all'} role="tab" aria-selected={active}
                      onClick={() => setFilter('completion', t.v)}
                      className="flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                      style={active
                        ? { background: 'var(--surface)', color: 'var(--teal)', boxShadow: '0 1px 4px rgba(15,23,42,0.10)' }
                        : { color: 'var(--text-muted)' }}>
                      {t.l}
                    </button>
                  )
                })}
              </div>
            )}
            {view === 'map' ? (
              <PropertiesMapView
                pins={mapPins}
                searching={mapLoading}
                onSearchThisArea={bounds => fetchMapProperties(bounds)}
              />
            ) : loading ? (
              <div className={cn(view === 'grid' ? 'grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-4')}>
                {Array(9).fill(null).map((_, i) => (
                  <PropertyCard key={i} property={undefined} loading layout={view === 'grid' ? 'grid' : 'row'} />
                ))}
              </div>
            ) : listItems.length === 0 ? (
              <EmptyState onClear={clearFilters} />
            ) : (
              <>
                <div className={cn(view === 'grid' ? 'grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-4')}>
                  {listItems.map((entry, i) => (
                    <Fragment key={entry.key}>
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i, 10) * 0.04 }}>
                        {entry.kind === 'project'
                          ? <ProjectCard project={entry.item} layout={view === 'grid' ? 'grid' : 'row'} markAsProject />
                          : <PropertyCard property={entry.item} loading={!entry.item} layout={view === 'grid' ? 'grid' : 'row'} />}
                      </motion.div>
                      {/* No sidebar below xl — the ad sits in the list instead, after the 6th listing. */}
                      {i === 5 && <AdSlot placement="listings" variant="wide" className="xl:hidden col-span-full" />}
                    </Fragment>
                  ))}
                </div>

                <Pagination
                  page={filters.page || 1}
                  totalPages={pageCount}
                  onChange={p => setFilter('page', p)}
                  total={total}
                  perPage={PER_PAGE}
                  itemLabel={total === 1 ? 'property' : 'properties'}
                />
              </>
            )}

          </div>

          {/* ── Right: Sidebar (ads + buying behavior) ────── */}
          <aside className="hidden xl:flex flex-col gap-5 flex-shrink-0 w-[300px]">
            <AlertCard filters={filters} />
            <RecentlyViewedCard />
              <TrendingAreasCard
                kind={isRent ? 'rent' : 'sale'}
                basePath={forcedListingType === 'rent' ? '/for-rent' : forcedListingType === 'sale' ? '/for-sale' : '/buyer/properties'}
              />
            {/* Only the ad sticks — a whole sticky column taller than the screen would hide the cards below it. */}
            {/* Sits just under the sticky filter bar (navbar 64px + bar ~64px). */}
            <div className="sticky" style={{ top: 144 }}>
              <AdSlot placement="listings" variant="tall" />
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  )
}
