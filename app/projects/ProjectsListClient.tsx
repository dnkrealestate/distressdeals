'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, ChevronRight, MapPin, Building2, Globe2, ChevronDown, X, LayoutList, Grid3X3, TrendingUp, Sparkles } from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import ProjectCard from '@/components/buyer/ProjectCard'
import { projectAPI } from '@/lib/api'
import { UAE_EMIRATES } from '@/lib/constants'
import type { Project } from '@/types'
import { cn } from '@/lib/utils'

const STATUSES: { value: Project['status'] | ''; label: string }[] = [
  { value: '',                   label: 'All' },
  { value: 'upcoming',           label: 'Upcoming' },
  { value: 'under_construction', label: 'Under Construction' },
  { value: 'ready',              label: 'Ready' },
  { value: 'sold_out',           label: 'Sold Out' },
]

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

/* ─── SIDEBAR: SPONSORED AD ──────────────────────────────── */
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
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Featured Developments</h3>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {SPONSORED.map(s => (
          <Link
            key={s.title}
            href="#"
            className="flex gap-3 p-2.5 rounded-xl transition-colors group"
            style={{ border: '1px solid var(--border)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(203,1,1,0.40)' }}
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

/* ─── STATUS PILL — segmented group, live count baked into the label ── */
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

export default function ProjectsListClient() {
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState({
    q: '', area: '', developer: '', status: '' as Project['status'] | '',
    emirate: searchParams.get('emirate') || '',
    page: 1,
  })
  const [query,   setQuery]   = useState('')
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

  const limit = 12

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

  const fetchProjects = useCallback(() => {
    setLoading(true)
    projectAPI.getAll({
      q: filters.q || undefined, area: filters.area || undefined,
      developer: filters.developer || undefined, status: filters.status || undefined,
      emirate: filters.emirate || undefined,
      page: filters.page, limit,
    })
      .then(r => { if (r.data.success) { setProjects(r.data.data.data || []); setTotal(r.data.data.total || 0); setTotalPages(r.data.data.totalPages || 1) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  // Status counts respect every OTHER active filter, same reasoning as the
  // property-type counts row on /for-sale — each pill shows what picking
  // THAT status would return from the current search, not just the active one.
  useEffect(() => {
    projectAPI.getStatusStats({ q: filters.q || undefined, area: filters.area || undefined, developer: filters.developer || undefined, emirate: filters.emirate || undefined })
      .then(r => { if (r.data.success) { setStatusStats(r.data.data.stats); setStatusStatsTotal(r.data.data.total) } })
      .catch(() => {})
  }, [filters.q, filters.area, filters.developer, filters.emirate])

  const activeFilterCount = [filters.area, filters.developer, filters.status, filters.emirate].filter(Boolean).length

  return (
    <div className="page overflow-x-hidden">
      <Navbar />

      {/* ── Breadcrumb + heading ─────────────────────────── */}
      <div className="wrap pt-5">
        <nav className="flex items-center gap-1.5 text-xs mb-3" style={{ color: 'var(--text-muted)' }} aria-label="Breadcrumb">
          <Link href="/" className="transition-colors hover:text-[var(--teal)]">Home</Link>
          <ChevronRight size={11} />
          <span style={{ color: 'var(--text)' }}>New Projects</span>
        </nav>

        <h1 className="heading-md mb-1">
          Off-Plan <span className="grad-text">New Projects</span>
        </h1>
        <p className="muted">
          {loading ? 'Loading…' : `${total.toLocaleString()} developments found`}
        </p>
      </div>

      {/* ── Modern floating filter card ──────────────────── */}
      <div className="wrap pt-6 pb-2 sticky top-20 z-30">
        <div
          className="rounded-3xl p-4 sm:p-5"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 12px 32px -12px rgba(15,23,42,0.18)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Search */}
          <div className="input-glass flex items-center gap-2.5 h-12 px-4 rounded-2xl mb-4">
            <Search size={16} style={{ color: 'var(--teal)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by project name, developer, or area…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="bg-transparent flex-1 text-sm outline-none min-w-0"
              style={{ color: 'var(--text)' }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                <X size={13} style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>

          {/* Status pills + Area/Developer selects */}
          <div className="flex flex-wrap items-center gap-2.5 justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              <StatusPill active={!filters.status} onClick={() => setFilter('status', '')}>
                All <span style={{ opacity: 0.7 }}>· {statusStatsTotal.toLocaleString()}</span>
              </StatusPill>
              {STATUSES.filter(s => s.value).map(s => {
                const count = statusStats.find(x => x.status === s.value)?.count || 0
                if (!count) return null
                return (
                  <StatusPill key={s.value} active={filters.status === s.value} onClick={() => setFilter('status', filters.status === s.value ? '' : s.value)}>
                    {s.label} <span style={{ opacity: 0.7 }}>· {count.toLocaleString()}</span>
                  </StatusPill>
                )
              })}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Emirate */}
              <div className="relative">
                <Globe2 size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--teal)', pointerEvents: 'none' }} />
                <select
                  value={filters.emirate}
                  onChange={e => setFilter('emirate', e.target.value)}
                  className="select-field h-10 pl-8 pr-8 text-xs rounded-xl"
                  style={{ color: filters.emirate ? 'var(--text)' : 'var(--text-muted)' }}
                >
                  <option value="">Any Emirate</option>
                  {UAE_EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <ChevronDown size={11} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>

              {/* Area */}
              <div className="relative">
                <MapPin size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--teal)', pointerEvents: 'none' }} />
                <select
                  value={filters.area}
                  onChange={e => setFilter('area', e.target.value)}
                  className="select-field h-10 pl-8 pr-8 text-xs rounded-xl"
                  style={{ color: filters.area ? 'var(--text)' : 'var(--text-muted)' }}
                >
                  <option value="">Any Area</option>
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown size={11} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>

              {/* Developer */}
              <div className="relative">
                <Building2 size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--teal)', pointerEvents: 'none' }} />
                <select
                  value={filters.developer}
                  onChange={e => setFilter('developer', e.target.value)}
                  className="select-field h-10 pl-8 pr-8 text-xs rounded-xl"
                  style={{ color: filters.developer ? 'var(--text)' : 'var(--text-muted)' }}
                >
                  <option value="">Any Developer</option>
                  {developers.map(d => <option key={d.developer} value={d.developer}>{d.developer} ({d.count})</option>)}
                </select>
                <ChevronDown size={11} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>

              {/* View toggle */}
              <div className="flex rounded-lg overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--border)' }}>
                {(['list', 'grid'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className="p-2 transition-colors"
                    title={v === 'list' ? 'List view' : 'Grid view'}
                    style={{
                      background: view === v ? 'rgba(203,1,1,0.10)' : 'transparent',
                      color:      view === v ? 'var(--teal)' : 'var(--text-muted)',
                    }}
                  >
                    {v === 'list' ? <LayoutList size={15} /> : <Grid3X3 size={15} />}
                  </button>
                ))}
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters(f => ({ ...f, area: '', developer: '', status: '', emirate: '' }))}
                  className="text-xs px-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

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
                    <motion.div key={project._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <ProjectCard project={project} layout={view === 'grid' ? 'grid' : 'row'} />
                    </motion.div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setFilter('page', p)}
                        className="w-9 h-9 rounded-lg text-sm font-medium border transition-all"
                        style={{
                          borderColor: filters.page === p ? 'var(--teal)' : 'var(--border)',
                          background:  filters.page === p ? 'rgba(203,1,1,0.10)' : 'transparent',
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
                  onClick={() => { setQuery(''); setFilters({ q: '', area: '', developer: '', status: '', emirate: '', page: 1 }) }}
                  className="btn-primary btn-sm"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* ── Right: Sidebar (same relationship as the buy listing page) ── */}
          <aside className="hidden xl:flex flex-col gap-5 flex-shrink-0 w-[300px]">
            <div className="sticky top-40 flex flex-col gap-5">
              <TopDevelopersCard developers={developers} />
              <SponsoredCard />
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </div>
  )
}
