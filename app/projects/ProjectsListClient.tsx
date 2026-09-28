'use client'

import { useState, useEffect, useCallback, useRef, Suspense, Fragment } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, ChevronRight, MapPin, Building2, Globe2, ChevronDown, X, LayoutList, Grid3X3, TrendingUp, Sparkles, CalendarClock, Wallet, Home } from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import ProjectCompareBar from '@/components/buyer/ProjectCompareBar'
import AdSlot from '@/components/shared/AdSlot'
import RecentlyViewedCard from '@/components/buyer/RecentlyViewedCard'
import Pagination from '@/components/shared/Pagination'
import Footer from '@/components/layouts/Footer'
import ProjectCard from '@/components/buyer/ProjectCard'
import { projectAPI } from '@/lib/api'
import { UAE_EMIRATES } from '@/lib/constants'
import type { Project } from '@/types'
import { cn } from '@/lib/utils'
import { FilterDropdown, DropdownOption, Pill } from '@/components/buyer/PropertyFilterBar'
import { Map as MapIcon, Layers } from 'lucide-react'

const STATUSES: { value: Project['status'] | ''; label: string }[] = [
  { value: '',                   label: 'All' },
  { value: 'upcoming',           label: 'Upcoming' },
  { value: 'under_construction', label: 'Under Construction' },
  { value: 'ready',              label: 'Ready' },
  { value: 'sold_out',           label: 'Sold Out' },
]

// New Projects filters beyond status/area/developer: when it's handed over, the delivery quarter,
// a starting-price budget and the unit type. Handover keys encode the backend param:
//   y2027 → handoverYear=2027 · min2030 → handoverYearMin=2030 · max2027 → handoverYearMax=2027
const CURRENT_YEAR = new Date().getFullYear()
const HANDOVER_CHOICES: { k: string; l: string }[] = [
  { k: '', l: 'Any handover' },
  { k: `max${CURRENT_YEAR}`, l: `This year (${CURRENT_YEAR})` },
  { k: `max${CURRENT_YEAR + 1}`, l: `By ${CURRENT_YEAR + 1}` },
  { k: `max${CURRENT_YEAR + 2}`, l: `By ${CURRENT_YEAR + 2}` },
  ...[0, 1, 2, 3].map(i => ({ k: `y${CURRENT_YEAR + i}`, l: `${CURRENT_YEAR + i} only` })),
  { k: `min${CURRENT_YEAR + 4}`, l: `${CURRENT_YEAR + 4} & beyond` },
]
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const PRICE_CHOICES = [
  { l: 'Any price', min: 0,       max: 0        },
  { l: 'Under 1M',  min: 0,       max: 1000000  },
  { l: '1M – 2M',   min: 1000000, max: 2000000  },
  { l: '2M – 5M',   min: 2000000, max: 5000000  },
  { l: '5M – 10M',  min: 5000000, max: 10000000 },
  { l: '10M +',     min: 10000000, max: 0       },
]
const TYPE_CHOICES = [
  { v: 'apartment', l: 'Apartments' }, { v: 'villa', l: 'Villas' }, { v: 'townhouse', l: 'Townhouses' },
  { v: 'penthouse', l: 'Penthouses' }, { v: 'studio', l: 'Studios' },
]
function handoverParams(k: string) {
  const m = /^(y|min|max)(\d{4})$/.exec(k)
  if (!m) return {}
  return { [m[1] === 'y' ? 'handoverYear' : m[1] === 'min' ? 'handoverYearMin' : 'handoverYearMax']: Number(m[2]) }
}
// Label for a handover key that came from a link (e.g. the homepage search) but isn't one of the preset choices.
function handoverKeyLabel(k: string) {
  const m = /^(y|min|max)(\d{4})$/.exec(k)
  if (!m) return k
  return m[1] === 'y' ? `${m[2]} only` : m[1] === 'min' ? `${m[2]} & beyond` : `By ${m[2]}`
}
function handoverKeyFromUrl(sp: URLSearchParams) {
  if (sp.get('handoverYear')) return `y${sp.get('handoverYear')}`
  if (sp.get('handoverYearMin')) return `min${sp.get('handoverYearMin')}`
  if (sp.get('handoverYearMax')) return `max${sp.get('handoverYearMax')}`
  return ''
}

interface DeveloperStat { developer: string; count: number; slug: string }

const SPONSORED = [
  { title: 'Marina Vista Residences', area: 'Dubai Marina', price: 'AED 1.2M', tag: 'Sponsored' },
  { title: 'Hills Park Views',        area: 'Dubai Hills',  price: 'AED 2.4M', tag: 'Sponsored' },
]

/* ─── SIDEBAR: TOP DEVELOPERS ─────────────────────────────── */
function TopDevelopersCard({ developers }: { developers: DeveloperStat[] }) {
  if (developers.length === 0) return null
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(203,1,1,0.10)', border: '1px solid rgba(203,1,1,0.20)' }}
        >
          <TrendingUp size={15} style={{ color: 'var(--teal)' }} />
        </div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Top Developers</h3>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Most active in Dubai</p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {developers.slice(0, 5).map((d, i) => (
          <Link
            key={d.developer}
            href={`/developers/${d.slug}`}
            className="flex items-center justify-between py-2.5 px-2 rounded-lg transition-colors group"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(203,1,1,0.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: 'var(--bg-alt)', color: 'var(--text-muted)' }}
              >
                {i + 1}
              </span>
              <p className="text-xs font-medium truncate transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>{d.developer}</p>
            </div>
            <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{d.count} projects</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function StatusPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200"
      style={{
        background:  active ? 'var(--grad)' : 'transparent',
        color:       active ? '#fff' : 'var(--text-mid)',
        boxShadow:   active ? '0 6px 16px rgba(203,1,1,0.30)' : 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

// `bottom`: server-rendered blocks under the list, above the footer ("More searches", the new-projects guide).
export default function ProjectsListClient({ bottom }: { bottom?: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ProjectsListClientInner bottom={bottom} />
    </Suspense>
  )
}

function ProjectsListClientInner({ bottom }: { bottom?: React.ReactNode }) {
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '', area: searchParams.get('area') || '', developer: searchParams.get('developer') || '',
    // From "More searches" links: ?tag=luxury, ?community=…
    tag: searchParams.get('tag') || '', community: searchParams.get('community') || '',
    status: (searchParams.get('status') || '') as Project['status'] | '',
    emirate: searchParams.get('emirate') || '',
    type: searchParams.get('type') || '',
    priceMin: Number(searchParams.get('priceMin')) || 0,
    priceMax: Number(searchParams.get('priceMax')) || 0,
    handover: handoverKeyFromUrl(searchParams),
    quarter: /^Q[1-4]$/.test(searchParams.get('handoverQuarter') || '') ? (searchParams.get('handoverQuarter') as string) : '',
    page: 1,
  })
  const [query,   setQuery]   = useState(searchParams.get('q') || '')
  // Bayut-style horizontal list rows by default — grid is the compact
  // alternative, same relationship as the property list pages.
  const [view, setView] = useState<'list' | 'grid'>('list')

  const [projects,   setProjects]   = useState<Project[]>([])
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading,    setLoading]    = useState(true)

  const [areas,          setAreas]          = useState<string[]>([])
  const [developers,     setDevelopers]     = useState<DeveloperStat[]>([])
  const [statusStats,    setStatusStats]    = useState<{ status: string; count: number }[]>([])
  const [statusStatsTotal, setStatusStatsTotal] = useState(0)

  const limit = 40 // projects per page

  const searchWrapRef = useRef<HTMLDivElement>(null)
  const [pastSearch, setPastSearch] = useState(false)
  useEffect(() => {
    const el = searchWrapRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setPastSearch(!e.isIntersecting && e.boundingClientRect.top < 0), { rootMargin: '-64px 0px 0px 0px', threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Filter option sources — fetched once, independent of the active filters.
  useEffect(() => {
    projectAPI.getAreas().then(r => { if (r.data.success) setAreas(r.data.data) }).catch(() => {})
    projectAPI.getAllDevelopers().then(r => { if (r.data.success) setDevelopers(r.data.data) }).catch(() => {})
  }, [])

  // Debounce the keyword field into `filters.q` — every other control
  // applies immediately.
  useEffect(() => {
    const t = setTimeout(() => setFilters(f => ({ ...f, q: query, page: 1 })), query ? 350 : 0)
    return () => clearTimeout(t)
  }, [query])

  const setFilter = (key: keyof typeof filters, val: any) => setFilters(f => ({ ...f, [key]: val, page: key === 'page' ? val : 1 }))

  // Everything but status/page — shared by the list and the status counts so they always agree.
  const searchParamsFor = useCallback(() => ({
    q: filters.q || undefined, area: filters.area || undefined,
    developer: filters.developer || undefined, emirate: filters.emirate || undefined,
    type: filters.type || undefined,
    priceMin: filters.priceMin || undefined, priceMax: filters.priceMax || undefined,
    ...handoverParams(filters.handover),
    handoverQuarter: filters.quarter || undefined,
    tag: filters.tag || undefined, community: filters.community || undefined,
  }), [filters.q, filters.area, filters.developer, filters.emirate, filters.type, filters.priceMin, filters.priceMax, filters.handover, filters.quarter, filters.tag, filters.community])

  const fetchProjects = useCallback(() => {
    setLoading(true)
    projectAPI.getAll({
      ...searchParamsFor(), status: filters.status || undefined,
      page: filters.page, limit,
    })
      .then(r => { if (r.data.success) { setProjects(r.data.data.data || []); setTotal(r.data.data.total || 0); setTotalPages(r.data.data.totalPages || 1) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filters.status, filters.page, searchParamsFor])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  // Status counts respect every OTHER active filter, same reasoning as the
  // property-type counts row on /for-sale — each pill shows what picking
  // THAT status would return from the current search, not just the active one.
  useEffect(() => {
    projectAPI.getStatusStats(searchParamsFor())
      .then(r => { if (r.data.success) { setStatusStats(r.data.data.stats); setStatusStatsTotal(r.data.data.total) } })
      .catch(() => {})
  }, [searchParamsFor])

  const activeFilterCount = [filters.area, filters.developer, filters.status, filters.emirate, filters.type, filters.priceMin, filters.priceMax, filters.handover, filters.quarter, filters.tag, filters.community].filter(Boolean).length
  const clearAll = () => setFilters(f => ({ ...f, area: '', developer: '', status: '', emirate: '', type: '', priceMin: 0, priceMax: 0, handover: '', quarter: '', tag: '', community: '' }))

  return (
    <div className="page overflow-x-clip">
      <Navbar />
      <ProjectCompareBar />

      {/* ── Breadcrumb + heading ─────────────────────────── */}
      <div className="wrap pt-5">
        <nav className="flex items-center gap-1.5 text-xs mb-3" style={{ color: 'var(--text-muted)' }} aria-label="Breadcrumb">
          <Link href="/" className="transition-colors hover:text-[var(--teal)]">Home</Link>
          <ChevronRight size={11} />
          <span style={{ color: 'var(--text)' }}>New Projects</span>
        </nav>

        <h1 className="heading-md mb-1">
          Off-Plan <span className="grad-text">Projects in Dubai</span>
        </h1>
        <p className="muted">
          {loading ? 'Loading…' : `${total.toLocaleString()} developments found`}
        </p>
      </div>

      {/* ── SEARCH — same model as the for-sale page ── */}
      <div ref={searchWrapRef} className="wrap pt-6 pb-4">
        <div className="flex items-center gap-2 p-2 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 12px 32px -14px rgba(15,23,42,0.22)' }}>
          <div className="flex items-center gap-2.5 flex-1 min-w-0 h-12 px-3">
            <Search size={18} style={{ color: 'var(--teal)', flexShrink: 0 }} />
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search by project name, developer, community or area…"
              className="bg-transparent flex-1 text-sm md:text-base outline-none min-w-0" style={{ color: 'var(--text)' }}
            />
            {query && <button onClick={() => setQuery('')} aria-label="Clear search" style={{ color: 'var(--text-muted)' }}><X size={15} /></button>}
          </div>
          <Link href="/map-search" className="hidden sm:inline-flex items-center gap-1.5 h-12 px-4 rounded-xl text-sm font-semibold flex-shrink-0" style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
            <MapIcon size={16} style={{ color: 'var(--teal)' }} /> Map
          </Link>
          <button onClick={() => setFilters(f => ({ ...f, q: query, page: 1 }))} className="btn-primary h-12 px-5 md:px-7 flex-shrink-0 gap-2">
            <Search size={16} /> <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>

      {/* ── Filter bar: every filter as a dropdown; sticks to the top once the search box scrolls away ── */}
      <div className={cn('z-30', pastSearch ? 'sticky top-16' : 'relative')}
        style={pastSearch ? { background: 'var(--surface)', borderBottom: '1px solid var(--border)', boxShadow: '0 8px 20px -14px rgba(15,23,42,0.25)' } : undefined}>
        <div className={cn('wrap flex items-center gap-2 flex-wrap', pastSearch ? 'py-3' : 'pb-1')}>
          <FilterDropdown label={STATUSES.find(x => x.value === filters.status && x.value)?.label || 'Status'} icon={Layers} active={!!filters.status} widthClass="w-60">
            {close => (
              <div className="flex flex-col gap-1">
                {STATUSES.map(st => {
                  const n = st.value ? statusStats.find(x => x.status === st.value)?.count || 0 : statusStatsTotal
                  return <DropdownOption key={st.value || 'all'} active={filters.status === st.value} onClick={() => { setFilter('status', st.value); close() }}>{st.label} <span style={{ opacity: 0.55 }}>· {n.toLocaleString()}</span></DropdownOption>
                })}
              </div>
            )}
          </FilterDropdown>
          <FilterDropdown label={filters.emirate || 'Emirate'} icon={Globe2} active={!!filters.emirate} widthClass="w-52">
            {close => (
              <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
                <DropdownOption active={!filters.emirate} onClick={() => { setFilter('emirate', ''); close() }}>Any emirate</DropdownOption>
                {UAE_EMIRATES.map(e => <DropdownOption key={e} active={filters.emirate === e} onClick={() => { setFilter('emirate', e); close() }}>{e}</DropdownOption>)}
              </div>
            )}
          </FilterDropdown>
          <FilterDropdown label={filters.area || 'Area'} icon={MapPin} active={!!filters.area} widthClass="w-60">
            {close => (
              <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
                <DropdownOption active={!filters.area} onClick={() => { setFilter('area', ''); close() }}>Any area</DropdownOption>
                {areas.map(a => <DropdownOption key={a} active={filters.area === a} onClick={() => { setFilter('area', a); close() }}>{a}</DropdownOption>)}
              </div>
            )}
          </FilterDropdown>
          <FilterDropdown label={filters.developer || 'Developer'} icon={Building2} active={!!filters.developer} widthClass="w-64">
            {close => (
              <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
                <DropdownOption active={!filters.developer} onClick={() => { setFilter('developer', ''); close() }}>Any developer</DropdownOption>
                {developers.map(d => <DropdownOption key={d.developer} active={filters.developer === d.developer} onClick={() => { setFilter('developer', d.developer); close() }}>{d.developer} <span style={{ opacity: 0.55 }}>· {d.count}</span></DropdownOption>)}
              </div>
            )}
          </FilterDropdown>
          <FilterDropdown
            label={[filters.quarter, filters.handover ? (HANDOVER_CHOICES.find(h => h.k === filters.handover)?.l || handoverKeyLabel(filters.handover)) : ''].filter(Boolean).join(' · ') || 'Handover'}
            icon={CalendarClock} active={!!(filters.handover || filters.quarter)} widthClass="w-64">
            {close => (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Quarter</p>
                  <div className="flex gap-1.5">
                    {QUARTERS.map(q => <Pill key={q} active={filters.quarter === q} onClick={() => setFilter('quarter', filters.quarter === q ? '' : q)} className="flex-1 py-1.5">{q}</Pill>)}
                  </div>
                </div>
                <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                  {HANDOVER_CHOICES.map(h => <DropdownOption key={h.k || 'any'} active={filters.handover === h.k} onClick={() => { setFilter('handover', h.k); close() }}>{h.l}</DropdownOption>)}
                </div>
              </div>
            )}
          </FilterDropdown>
          <FilterDropdown
            label={PRICE_CHOICES.find(pc => pc.min === filters.priceMin && pc.max === filters.priceMax && (pc.min || pc.max))?.l || (filters.priceMin || filters.priceMax ? 'Custom price' : 'Price')}
            icon={Wallet} active={!!(filters.priceMin || filters.priceMax)} widthClass="w-52">
            {close => (
              <div className="flex flex-col gap-1">
                {PRICE_CHOICES.map(pc => <DropdownOption key={pc.l} active={filters.priceMin === pc.min && filters.priceMax === pc.max} onClick={() => { setFilters(f => ({ ...f, priceMin: pc.min, priceMax: pc.max, page: 1 })); close() }}>{pc.min || pc.max ? `AED ${pc.l}` : pc.l}</DropdownOption>)}
              </div>
            )}
          </FilterDropdown>
          <FilterDropdown label={TYPE_CHOICES.find(t => t.v === filters.type)?.l || 'Type'} icon={Home} active={!!filters.type} widthClass="w-48">
            {close => (
              <div className="flex flex-col gap-1">
                <DropdownOption active={!filters.type} onClick={() => { setFilter('type', ''); close() }}>Any type</DropdownOption>
                {TYPE_CHOICES.map(t => <DropdownOption key={t.v} active={filters.type === t.v} onClick={() => { setFilter('type', t.v); close() }}>{t.l}</DropdownOption>)}
              </div>
            )}
          </FilterDropdown>
          {activeFilterCount > 0 && (
            <button onClick={clearAll} className="text-xs font-semibold px-2 inline-flex items-center gap-1" style={{ color: 'var(--teal)' }}>
              <X size={12} /> Clear ({activeFilterCount})
            </button>
          )}
          <div className="ml-auto flex rounded-lg overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--border)' }}>
            {(['list', 'grid'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className="p-2 transition-colors" title={v === 'list' ? 'List view' : 'Grid view'}
                style={{ background: view === v ? 'rgba(203,1,1,0.10)' : 'transparent', color: view === v ? 'var(--teal)' : 'var(--text-muted)' }}>
                {v === 'list' ? <LayoutList size={15} /> : <Grid3X3 size={15} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Status counts row (like the for-sale page's property-type counts) ── */}
      {!pastSearch && (
        <div className="wrap pt-3 flex items-center gap-2 overflow-x-auto overflow-y-hidden scrollbar-hide">
          <StatusPill active={!filters.status} onClick={() => setFilter('status', '')}>
            All <span style={{ opacity: 0.7 }}>· {statusStatsTotal.toLocaleString()}</span>
          </StatusPill>
          {STATUSES.filter(st => st.value).map(st => {
            const count = statusStats.find(x => x.status === st.value)?.count || 0
            if (!count) return null
            return (
              <StatusPill key={st.value} active={filters.status === st.value} onClick={() => setFilter('status', filters.status === st.value ? '' : st.value)}>
                {st.label} <span style={{ opacity: 0.7 }}>· {count.toLocaleString()}</span>
              </StatusPill>
            )
          })}
        </div>
      )}

      {/* ── Results + sidebar ─────────────────────────────── */}
      <section className="pt-8 pb-20">
        <div className="wrap flex gap-6">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
                {Array(6).fill(null).map((_, i) => <div key={i} className={cn('shimmer rounded-2xl', view === 'grid' ? 'h-80' : 'h-52')} />)}
              </div>
            ) : projects.length > 0 ? (
              <>
                <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
                  {projects.map((project, i) => (
                    <Fragment key={project._id}>
                      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.05 }}>
                        <ProjectCard project={project} layout={view === 'grid' ? 'grid' : 'row'} />
                      </motion.div>
                      {/* No sidebar below xl — the ad sits in the list instead. */}
                      {i === 5 && <AdSlot placement="listings" variant="wide" className="xl:hidden col-span-full" />}
                    </Fragment>
                  ))}
                </div>

                <Pagination
                  page={filters.page || 1}
                  totalPages={totalPages}
                  onChange={p => setFilter('page', p)}
                  total={total}
                  perPage={limit}
                  itemLabel={total === 1 ? 'project' : 'projects'}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(203,1,1,0.08)', border: '1px solid rgba(203,1,1,0.20)' }}
                >
                  <Building2 size={24} style={{ color: 'var(--teal)' }} />
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>No projects found</h3>
                <p className="muted mb-6 max-w-xs">Try a different area, developer, or status.</p>
                <button
                  onClick={() => { setQuery(''); setFilters({ q: '', area: '', developer: '', status: '', emirate: '', type: '', priceMin: 0, priceMax: 0, handover: '', quarter: '', tag: '', community: '', page: 1 }) }}
                  className="btn-primary btn-sm"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* ── Right: Sidebar (same relationship as the buy listing page) ── */}
          <aside className="hidden xl:flex flex-col gap-5 flex-shrink-0 w-[300px]">
            <TopDevelopersCard developers={developers} />
            <RecentlyViewedCard />
            {/* Sticks under the navbar, same as the for-sale page. */}
            <div className="sticky" style={{ top: 88 }}>
              <AdSlot placement="listings" variant="tall" />
            </div>
          </aside>
        </div>
      </section>

      {bottom}

      <Footer />
    </div>
  )
}
