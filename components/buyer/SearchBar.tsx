'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search, MapPin, Home, SlidersHorizontal,
  ChevronDown, X, Check, Sparkles, Loader2,
} from 'lucide-react'
import { propertyAPI } from '@/lib/api'
import type { PropertyFilters } from '@/types'
import toast from 'react-hot-toast'

const DUBAI_AREAS = [
  'Downtown Dubai','Dubai Marina','Palm Jumeirah','Business Bay','JBR',
  'DIFC','Arabian Ranches','Dubai Hills','MBR City','Jumeirah','Al Barsha',
  'Deira','Bur Dubai','Silicon Oasis','Sports City','Motor City','JVC',
  'JLT','Discovery Gardens','Al Furjan','Mirdif','Ras Al Khor',
]

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa',     label: 'Villa'     },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'studio',    label: 'Studio'    },
  { value: 'office',    label: 'Office'    },
  { value: 'retail',    label: 'Retail'    },
  { value: 'plot',      label: 'Plot'      },
]

const BEDROOM_OPTIONS = ['Studio', '1', '2', '3', '4', '5', '6+']

const PRICE_RANGES = [
  { label: 'Any',            min: 0,         max: 0         },
  { label: 'Under AED 500K', min: 0,         max: 500000    },
  { label: 'AED 500K – 1M',  min: 500000,    max: 1000000   },
  { label: 'AED 1M – 2M',    min: 1000000,   max: 2000000   },
  { label: 'AED 2M – 5M',    min: 2000000,   max: 5000000   },
  { label: 'AED 5M – 10M',   min: 5000000,   max: 10000000  },
  { label: 'Above AED 10M',  min: 10000000,  max: 0         },
]

/* ── Pill chip ───────────────────────────────────────────── */
function Chip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="transition-all duration-150 text-xs font-medium px-3 py-1.5 rounded-lg border"
      style={{
        borderColor:  active ? 'var(--teal)'        : 'var(--border)',
        background:   active ? 'rgba(49,178,222,.1)' : 'transparent',
        color:        active ? 'var(--teal)'        : 'var(--text-muted)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

/* ── Area dropdown ───────────────────────────────────────── */
function AreaDropdown({
  value, onChange, fullWidth,
}: { value: string; onChange: (v: string) => void; fullWidth?: boolean }) {
  const [open, setOpen] = useState(false)
  const [q,    setQ]    = useState('')
  const ref      = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = DUBAI_AREAS.filter(a =>
    a.toLowerCase().includes(q.toLowerCase())
  )

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  return (
    <div ref={ref} className={`relative flex-shrink-0 ${fullWidth ? 'w-full' : 'w-44'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="input-glass w-full flex items-center justify-between gap-2 h-11 px-3 rounded-xl"
        style={{
          borderColor: open ? 'var(--teal)' : 'var(--border)',
          boxShadow:   open ? '0 0 0 3px rgba(49,178,222,0.12)' : 'none',
          cursor: 'pointer',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <MapPin size={13} style={{ color: 'var(--teal)', flexShrink: 0 }} />
          <span
            className="text-xs truncate"
            style={{ color: value ? 'var(--text)' : 'var(--text-muted)' }}
          >
            {value || 'Select area'}
          </span>
        </div>
        <ChevronDown
          size={11}
          className={`transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-xl overflow-hidden shadow-lg"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {/* Search */}
            <div
              className="p-2"
              style={{ borderBottom: '1px solid var(--border-soft)' }}
            >
              <div className="input-glass flex items-center gap-2 h-8 px-2.5 rounded-lg">
                <Search size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Filter…"
                  className="bg-transparent flex-1 text-xs outline-none"
                  style={{ color: 'var(--text)' }}
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto scrollbar-hide">
              <button
                onClick={() => { onChange(''); setOpen(false); setQ('') }}
                className="w-full px-3 py-2 text-left text-xs transition-colors"
                style={{ color: 'var(--text-muted)', background: 'transparent' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(49,178,222,0.05)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                Any area
              </button>

              {filtered.map(a => (
                <button
                  key={a}
                  onClick={() => { onChange(a); setOpen(false); setQ('') }}
                  className="w-full px-3 py-2 text-left text-xs transition-colors flex items-center justify-between"
                  style={{
                    background: value === a ? 'rgba(49,178,222,0.08)' : 'transparent',
                    color:      value === a ? 'var(--teal)'            : 'var(--text)',
                  }}
                  onMouseEnter={e => { if (value !== a) (e.currentTarget as HTMLElement).style.background = 'rgba(49,178,222,0.05)' }}
                  onMouseLeave={e => { if (value !== a) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  {a}
                  {value === a && <Check size={11} style={{ color: 'var(--teal)', flexShrink: 0 }} />}
                </button>
              ))}

              {filtered.length === 0 && (
                <p className="px-3 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  No areas found
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Reusable filter chip groups (shared by desktop panel + mobile modal) ── */
function BedroomChips({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {BEDROOM_OPTIONS.map(b => (
        <Chip key={b} active={value === b} onClick={() => onChange(value === b ? '' : b)}>
          {b === 'Studio' ? 'Studio' : `${b} BR`}
        </Chip>
      ))}
    </div>
  )
}

function PriceChips({ value, onChange }: { value: typeof PRICE_RANGES[number]; onChange: (v: typeof PRICE_RANGES[number]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRICE_RANGES.map(pr => (
        <Chip key={pr.label} active={value.label === pr.label} onClick={() => onChange(pr)}>
          {pr.label}
        </Chip>
      ))}
    </div>
  )
}

/* ── Mobile filter modal — search field + filter icon on mobile expand
   into this full bottom-sheet with every filter, plus AI search. ── */
function MobileFilterModal({
  open, onClose,
  tab, setTab,
  area, setArea,
  propType, setPropType,
  bedrooms, setBedrooms,
  priceRange, setPriceRange,
  onSearch, onApplyAI,
}: {
  open: boolean; onClose: () => void
  tab: 'sale' | 'rent'; setTab: (v: 'sale' | 'rent') => void
  area: string; setArea: (v: string) => void
  propType: string; setPropType: (v: string) => void
  bedrooms: string; setBedrooms: (v: string) => void
  priceRange: typeof PRICE_RANGES[number]; setPriceRange: (v: typeof PRICE_RANGES[number]) => void
  onSearch: () => void
  onApplyAI: (filters: PropertyFilters) => void
}) {
  const [aiQuery, setAiQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const askAI = async () => {
    if (!aiQuery.trim()) { toast.error("Describe what you're looking for first"); return }
    setAiLoading(true)
    try {
      const res = await propertyAPI.aiSearch(aiQuery.trim())
      if (res.data.success) {
        onApplyAI(res.data.data.filters as PropertyFilters)
        toast.success('Filters updated from your description')
      }
    } catch (err: any) {
      toast.error(err?.error || 'AI search is unavailable right now')
    } finally {
      setAiLoading(false)
    }
  }

  const activeCount =
    (bedrooms ? 1 : 0) + (priceRange.min ? 1 : 0) + (propType ? 1 : 0) + (area ? 1 : 0)

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl flex flex-col"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '88vh' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border-soft)' }}
            >
              <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Filters</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: 'var(--bg-alt)' }}>
                <X size={15} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-6">
              {/* Buy / Rent */}
              <div className="flex gap-2">
                {([{ id: 'sale', label: 'Buy' }, { id: 'rent', label: 'Rent' }] as const).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl border-none transition-all duration-200"
                    style={{
                      background: tab === t.id ? 'var(--grad)' : 'var(--bg-alt)',
                      color:      tab === t.id ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* AI search */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: 'var(--text-muted)' }}>
                  Or describe what you want
                </p>
                <div className="input-glass flex items-center gap-2 h-11 px-3 rounded-xl mb-2">
                  <Sparkles size={13} style={{ color: '#A855F7', flexShrink: 0 }} />
                  <input
                    value={aiQuery}
                    onChange={e => setAiQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && askAI()}
                    placeholder='"2BR apartment in Marina under 2M"'
                    className="bg-transparent flex-1 text-sm outline-none min-w-0"
                    style={{ color: 'var(--text)' }}
                  />
                </div>
                <button
                  onClick={askAI}
                  disabled={aiLoading}
                  className="btn-outline btn-sm w-full gap-1.5"
                  style={{ color: '#A855F7', borderColor: 'rgba(168,85,247,0.4)' }}
                >
                  {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  Ask AI
                </button>
              </div>

              {/* Area */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: 'var(--text-muted)' }}>
                  Area
                </p>
                <AreaDropdown value={area} onChange={setArea} fullWidth />
              </div>

              {/* Property type */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: 'var(--text-muted)' }}>
                  Property Type
                </p>
                <div className="relative w-full">
                  <Home size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--teal)', pointerEvents: 'none' }} />
                  <select
                    value={propType}
                    onChange={e => setPropType(e.target.value)}
                    className="select-field h-11 pl-8 pr-8 text-xs w-full rounded-xl"
                    style={{ color: propType ? 'var(--text)' : 'var(--text-muted)' }}
                  >
                    <option value="">Any type</option>
                    {PROPERTY_TYPES.map(pt => (
                      <option key={pt.value} value={pt.value}>{pt.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={11} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: 'var(--text-muted)' }}>
                  Bedrooms
                </p>
                <BedroomChips value={bedrooms} onChange={setBedrooms} />
              </div>

              {/* Price range */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: 'var(--text-muted)' }}>
                  Price Range
                </p>
                <PriceChips value={priceRange} onChange={setPriceRange} />
              </div>

              {activeCount > 0 && (
                <button
                  onClick={() => { setBedrooms(''); setPriceRange(PRICE_RANGES[0]); setPropType(''); setArea('') }}
                  className="text-xs transition-colors"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex gap-2 p-4 flex-shrink-0"
              style={{ borderTop: '1px solid var(--border-soft)', background: 'var(--surface)' }}
            >
              <button
                onClick={() => { onSearch(); onClose() }}
                className="btn-primary flex-1 h-11 text-sm rounded-xl"
              >
                <Search size={13} />
                Show Results
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/* ── Main SearchBar ──────────────────────────────────────── */
export default function SearchBar() {
  const router = useRouter()

  const [tab,         setTab]         = useState<'sale' | 'rent'>('sale')
  const [query,       setQuery]       = useState('')
  const [area,        setArea]        = useState('')
  const [propType,    setPropType]    = useState('')
  const [bedrooms,    setBedrooms]    = useState('')
  const [priceRange,  setPriceRange]  = useState(PRICE_RANGES[0])
  const [showFilters, setShowFilters] = useState(false)
  const [showMobileModal, setShowMobileModal] = useState(false)

  const activeCount =
    (bedrooms       ? 1 : 0) +
    (priceRange.min ? 1 : 0) +
    (propType       ? 1 : 0) +
    (area           ? 1 : 0)

  const handleSearch = () => {
    const p = new URLSearchParams()
    if (query)           p.set('q',        query)
    if (area)            p.set('area',      area)
    if (propType)        p.set('type',      propType)
    if (bedrooms)        p.set('bedrooms',  bedrooms === 'Studio' ? '0' : bedrooms.replace('+', ''))
    if (priceRange.min)  p.set('priceMin',  String(priceRange.min))
    if (priceRange.max)  p.set('priceMax',  String(priceRange.max))
    const base = tab === 'rent' ? '/for-rent' : '/for-sale'
    const qs = p.toString()
    router.push(qs ? `${base}?${qs}` : base)
  }

  // Maps the AI-parsed filters (from the "Ask AI" box in the mobile filter
  // modal) onto this bar's own discrete state, so the normal Search button
  // and URL-building logic can stay the single source of truth.
  const applyAIFilters = (filters: PropertyFilters) => {
    if (filters.listingType === 'sale' || filters.listingType === 'rent') setTab(filters.listingType)
    if (filters.q)    setQuery(filters.q)
    if (filters.area) setArea(filters.area)
    if (filters.type) setPropType(filters.type)
    if (filters.bedrooms !== undefined) {
      const n = filters.bedrooms
      setBedrooms(n === '0' ? 'Studio' : Number(n) >= 6 ? '6+' : n)
    }
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      const preset = PRICE_RANGES.find(pr => pr.min === (filters.priceMin || 0) && pr.max === (filters.priceMax || 0))
      setPriceRange(preset || { label: 'AI pick', min: filters.priceMin || 0, max: filters.priceMax || 0 })
    }
  }

  return (
    <div className="search-card">

      {/* ── Tab row ────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 pt-4"
        style={{ borderBottom: '1px solid var(--border-soft)' }}
      >
        <div className="flex gap-1">
          {([{ id: 'sale', label: 'Buy' }, { id: 'rent', label: 'Rent' }] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-t-xl border-none transition-all duration-200"
              style={{
                background:  tab === t.id ? 'var(--grad)' : 'transparent',
                color:       tab === t.id ? '#fff'        : 'var(--text-muted)',
                boxShadow:   tab === t.id ? '0 2px 10px rgba(49,178,222,0.28)' : 'none',
                cursor: 'pointer',
                position: 'relative', top: 1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="text-[10px] tracking-wider pb-3" style={{ color: 'var(--text-muted)' }}>
          {tab === 'sale' ? '2,400+ properties for sale' : '1,800+ properties for rent'}
        </p>
      </div>

      {/* ── Main row — mobile: keyword field + single filter icon ─── */}
      <div className="flex md:hidden gap-2 p-3">
        <div className="flex-1 input-glass flex items-center gap-2 h-11 px-3 rounded-xl min-w-0">
          <Search size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by keyword, project, developer…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="bg-transparent flex-1 text-sm outline-none min-w-0"
            style={{ color: 'var(--text)' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="flex-shrink-0 transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={13} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowMobileModal(true)}
          className="relative flex-shrink-0 flex items-center justify-center h-11 w-11 rounded-xl border"
          style={{
            borderColor: activeCount > 0 ? 'var(--teal)' : 'var(--border)',
            background:  activeCount > 0 ? 'rgba(49,178,222,0.08)' : 'transparent',
            color:       activeCount > 0 ? 'var(--teal)' : 'var(--text-muted)',
          }}
        >
          <SlidersHorizontal size={16} />
          {activeCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
              style={{ background: 'var(--grad)' }}
            >
              {activeCount}
            </span>
          )}
        </button>

        <button
          onClick={handleSearch}
          className="btn-primary flex-shrink-0 h-11 w-11 rounded-xl p-0 flex items-center justify-center"
        >
          <Search size={15} />
        </button>
      </div>

      {/* ── Main row — desktop ─────────────────────────── */}
      <div className="hidden md:flex gap-2 p-3">

        {/* Keyword */}
        <div className="flex-1 input-glass flex items-center gap-2 h-11 px-3 rounded-xl min-w-0">
          <Search size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by keyword, project, developer…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="bg-transparent flex-1 text-sm outline-none min-w-0"
            style={{ color: 'var(--text)' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="flex-shrink-0 transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={13} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>

        {/* Area */}
        <AreaDropdown value={area} onChange={setArea} />

        {/* Property type */}
        <div className="relative flex-shrink-0 w-40">
          <Home
            size={13}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--teal)', pointerEvents: 'none' }}
          />
          <select
            value={propType}
            onChange={e => setPropType(e.target.value)}
            className="select-field h-11 pl-8 pr-8 text-xs w-full rounded-xl"
            style={{ color: propType ? 'var(--text)' : 'var(--text-muted)' }}
          >
            <option value="">Property type</option>
            {PROPERTY_TYPES.map(pt => (
              <option key={pt.value} value={pt.value}>{pt.label}</option>
            ))}
          </select>
          <ChevronDown
            size={11}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
          />
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px self-stretch" style={{ background: 'var(--border)' }} />

        {/* Filters toggle */}
        <button
          onClick={() => setShowFilters(o => !o)}
          className="flex-shrink-0 flex items-center gap-2 h-11 px-4 rounded-xl border text-xs font-medium transition-all duration-200"
          style={{
            borderColor: showFilters ? 'var(--teal)' : 'var(--border)',
            background:  showFilters ? 'rgba(49,178,222,0.08)' : 'transparent',
            color:       showFilters ? 'var(--teal)' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <SlidersHorizontal size={13} />
          Filters
          {activeCount > 0 && (
            <span
              className="w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
              style={{ background: 'var(--grad)' }}
            >
              {activeCount}
            </span>
          )}
        </button>

        {/* Search CTA */}
        <button
          onClick={handleSearch}
          className="btn-primary flex-shrink-0 h-11 px-6 text-sm rounded-xl"
        >
          <Search size={13} />
          Search
        </button>
      </div>

      {/* ── Advanced filters ───────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div
              className="mx-4 mb-4"
              style={{ height: 1, background: 'var(--border-soft)' }}
            />
            <div className="flex flex-wrap gap-6 px-4 pb-4">

              {/* Bedrooms */}
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest mb-2.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Bedrooms
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {BEDROOM_OPTIONS.map(b => (
                    <Chip
                      key={b}
                      active={bedrooms === b}
                      onClick={() => setBedrooms(bedrooms === b ? '' : b)}
                    >
                      {b === 'Studio' ? 'Studio' : `${b} BR`}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px self-stretch" style={{ background: 'var(--border)' }} />

              {/* Price range */}
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest mb-2.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Price Range
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRICE_RANGES.map(pr => (
                    <Chip
                      key={pr.label}
                      active={priceRange.label === pr.label}
                      onClick={() => setPriceRange(pr)}
                    >
                      {pr.label}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Clear */}
              {(bedrooms || priceRange.min > 0) && (
                <button
                  onClick={() => { setBedrooms(''); setPriceRange(PRICE_RANGES[0]) }}
                  className="text-xs self-end pb-0.5 transition-colors"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--teal)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
                >
                  Clear filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileFilterModal
        open={showMobileModal}
        onClose={() => setShowMobileModal(false)}
        tab={tab} setTab={setTab}
        area={area} setArea={setArea}
        propType={propType} setPropType={setPropType}
        bedrooms={bedrooms} setBedrooms={setBedrooms}
        priceRange={priceRange} setPriceRange={setPriceRange}
        onSearch={handleSearch}
        onApplyAI={applyAIFilters}
      />
    </div>
  )
}