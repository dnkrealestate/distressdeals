'use client'
import { useEffect, useMemo, useState } from 'react'
import { Search, X, UserRound } from 'lucide-react'
import Pagination from '@/components/shared/Pagination'

// Shared list tooling for the admin content pages (developers, communities, buildings, blog, news) — the same
// search / filter / "added by" / sort / page-size / page navigation the Projects page has.

export interface Staff { _id: string; name: string; displayId?: string }
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

// "Added by Adil (AD-A1) · 25 Sep 2026 · Edited by Sara (E-A1) 26 Sep 2026"
export function Authorship({ createdBy, updatedBy, createdAt, updatedAt, className = '' }: {
  createdBy?: Staff | null; updatedBy?: Staff | null; createdAt?: string; updatedAt?: string; className?: string
}) {
  const who = (u: Staff) => <><strong style={{ color: 'var(--text-mid)' }}>{u.name}</strong>{u.displayId && <span className="font-mono">&nbsp;({u.displayId})</span>}</>
  return (
    <p className={`text-[11px] flex items-center gap-1 min-w-0 ${className}`} style={{ color: 'var(--text-muted)' }}>
      <UserRound size={10} className="flex-shrink-0" />
      <span className="truncate">
        {createdBy ? <>Added by {who(createdBy)}</> : 'Added'}{createdAt ? ` · ${fmtDate(createdAt)}` : ''}
        {updatedBy && updatedBy._id !== createdBy?._id && <> · Edited by {who(updatedBy)}{updatedAt ? ` ${fmtDate(updatedAt)}` : ''}</>}
      </span>
    </p>
  )
}

export const PAGE_SIZES = [10, 20, 50, 100]
export interface SortOption<T> { value: string; label: string; cmp: (a: T, b: T) => number }
export interface FilterDef<T> { key: string; label: string; get: (item: T) => string | string[] | undefined | null; format?: (v: string) => string }

// Everything filtered, sorted and paged in the browser (these lists are hundreds at most).
export function useAdminList<T extends { _id: string; createdBy?: Staff | null }>(key: string, items: T[], opts: {
  searchText: (item: T) => string
  filters?: FilterDef<T>[]
  sorts: SortOption<T>[]
  myId?: string
}) {
  const prefsKey = `dd-admin-list:${key}`
  const [q, setQ] = useState('')
  const [values, setValues] = useState<Record<string, string>>({})
  const [addedBy, setAddedBy] = useState('')
  const [sort, setSort] = useState(opts.sorts[0].value)
  const [limit, setLimitState] = useState(20)
  const [page, setPage] = useState(1)
  useEffect(() => { try { const n = Number(localStorage.getItem(prefsKey)); if (PAGE_SIZES.includes(n)) setLimitState(n) } catch { /* private mode */ } }, [prefsKey])
  const setLimit = (n: number) => { setLimitState(n); try { localStorage.setItem(prefsKey, String(n)) } catch { /* ignore */ } }
  useEffect(() => { setPage(1) }, [q, values, addedBy, sort, limit])

  // Options for each filter, with counts, from the whole list.
  const facets = useMemo(() => (opts.filters || []).map(f => {
    const counts = new Map<string, number>()
    items.forEach(i => { const v = f.get(i); (Array.isArray(v) ? v : [v]).filter(Boolean).forEach(x => counts.set(x as string, (counts.get(x as string) || 0) + 1)) })
    return { ...f, options: [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([value, count]) => ({ value, count })) }
  }), [items, opts.filters])
  const creators = useMemo(() => {
    const m = new Map<string, Staff & { count: number }>()
    items.forEach(i => { const c = i.createdBy; if (c?._id) m.set(c._id, { ...c, count: (m.get(c._id)?.count || 0) + 1 }) })
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [items])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const sorter = opts.sorts.find(s => s.value === sort) || opts.sorts[0]
    return items.filter(i => {
      if (needle && !opts.searchText(i).toLowerCase().includes(needle)) return false
      for (const f of opts.filters || []) {
        const want = values[f.key]; if (!want) continue
        const v = f.get(i); if (!(Array.isArray(v) ? v.includes(want) : v === want)) return false
      }
      if (addedBy === 'me') return i.createdBy?._id === opts.myId
      if (addedBy === 'unknown') return !i.createdBy
      if (addedBy) return i.createdBy?._id === addedBy
      return true
    }).sort(sorter.cmp)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, q, values, addedBy, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * limit, safePage * limit)
  const filtersOn = !!(q || addedBy || Object.values(values).some(Boolean) || sort !== opts.sorts[0].value)
  const clear = () => { setQ(''); setValues({}); setAddedBy(''); setSort(opts.sorts[0].value) }

  return {
    q, setQ, values, setValue: (k: string, v: string) => setValues(s => ({ ...s, [k]: v })), addedBy, setAddedBy, sort, setSort,
    limit, setLimit, page: safePage, setPage, totalPages, total: filtered.length, all: items.length, pageItems,
    facets, creators, filtersOn, clear, sorts: opts.sorts,
  }
}

type ListState = ReturnType<typeof useAdminList<any>>

export function AdminListToolbar({ list, placeholder, children }: { list: ListState; placeholder: string; children?: React.ReactNode }) {
  return (
    <div className="card p-3 sm:p-4 space-y-3 overflow-visible mb-4">
      <div className="flex flex-col lg:flex-row gap-2.5">
        <div className="input-glass flex items-center gap-2 h-11 px-3 rounded-xl flex-1 min-w-0">
          <Search size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
          <input value={list.q} onChange={e => list.setQ(e.target.value)} placeholder={placeholder}
            className="bg-transparent flex-1 text-sm outline-none min-w-0" style={{ color: 'var(--text)' }} />
          {list.q && <button onClick={() => list.setQ('')} style={{ color: 'var(--text-muted)' }} aria-label="Clear search"><X size={14} /></button>}
        </div>
        <select className="select-field h-11 text-sm lg:w-52" value={list.sort} onChange={e => list.setSort(e.target.value)} aria-label="Sort">
          {list.sorts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-center">
        {list.facets.map(f => (
          <select key={f.key} className="select-field text-sm" value={list.values[f.key] || ''} onChange={e => list.setValue(f.key, e.target.value)} aria-label={f.label}>
            <option value="">All {f.label.toLowerCase()}</option>
            {f.options.map(o => <option key={o.value} value={o.value}>{f.format ? f.format(o.value) : o.value} · {o.count}</option>)}
          </select>
        ))}
        <select className="select-field text-sm" value={list.addedBy} onChange={e => list.setAddedBy(e.target.value)} aria-label="Added by">
          <option value="">Added by anyone</option>
          <option value="me">Added by me</option>
          {list.creators.map(c => <option key={c._id} value={c._id}>{c.name}{c.displayId ? ` (${c.displayId})` : ''} · {c.count}</option>)}
          <option value="unknown">Before tracking began</option>
        </select>
        {children}
        {list.filtersOn && (
          <button onClick={list.clear} className="text-xs font-semibold hover:underline flex items-center gap-1 justify-self-start" style={{ color: 'var(--teal)' }}>
            <X size={12} /> Clear filters
          </button>
        )}
      </div>
      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {list.total === list.all ? `${list.all.toLocaleString()} in total` : `${list.total.toLocaleString()} of ${list.all.toLocaleString()} match`}
      </p>
    </div>
  )
}

export function AdminListFooter({ list, itemLabel }: { list: ListState; itemLabel: [string, string] }) {
  if (list.total === 0) return null
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        Show
        <select className="select-field h-9 py-0 text-xs" value={list.limit} onChange={e => list.setLimit(Number(e.target.value))} aria-label="Per page">
          {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        per page
      </label>
      <div className="[&>nav]:mt-0">
        <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} total={list.total} perPage={list.limit}
          itemLabel={list.total === 1 ? itemLabel[0] : itemLabel[1]} />
      </div>
    </div>
  )
}
