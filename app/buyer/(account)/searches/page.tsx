'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Bell, Search, Trash2, ArrowRight } from 'lucide-react'
import { savedSearchAPI } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { SavedSearch } from '@/types'
import toast from 'react-hot-toast'

function describeFilters(filters: SavedSearch['filters']): string {
  const bits: string[] = []
  if (filters.priceMin || filters.priceMax) {
    bits.push(`AED ${filters.priceMin ? (filters.priceMin / 1000) + 'k' : '0'}–${filters.priceMax ? (filters.priceMax / 1000) + 'k' : 'any'}`)
  }
  if (filters.furnishing) bits.push(filters.furnishing.replace('_', ' '))
  if (filters.completion) bits.push(filters.completion.replace('_', ' '))
  if (filters.q) bits.push(`"${filters.q}"`)
  return bits.join(' · ')
}

function toQueryString(filters: SavedSearch['filters']): string {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)) })
  return params.toString()
}

export default function SavedSearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    savedSearchAPI.getAll()
      .then(r => { if (r.data.success) setSearches(r.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggleAlerts = async (s: SavedSearch) => {
    setSearches(prev => prev.map(x => x._id === s._id ? { ...x, alertsEnabled: !x.alertsEnabled } : x))
    try { await savedSearchAPI.update(s._id, { alertsEnabled: !s.alertsEnabled }) }
    catch { toast.error('Failed to update'); load() }
  }

  const remove = async (s: SavedSearch) => {
    if (!confirm(`Delete saved search "${s.name}"?`)) return
    setSearches(prev => prev.filter(x => x._id !== s._id))
    try { await savedSearchAPI.delete(s._id); toast.success('Saved search deleted') }
    catch { toast.error('Failed to delete'); load() }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md mb-1">Saved <span className="grad-text">Searches</span></h1>
        <p className="muted">{loading ? 'Loading…' : `${searches.length} saved search${searches.length === 1 ? '' : 'es'} — we'll notify you of new matches`}</p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array(3).fill(null).map((_, i) => <div key={i} className="shimmer h-24 rounded-2xl" />)}</div>
      ) : searches.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center card">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(203,1,1,0.08)', border: '1px solid rgba(203,1,1,0.20)' }}>
            <Bell size={28} style={{ color: 'var(--teal)' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>No saved searches yet</h3>
          <p className="muted mb-7 max-w-xs">Search for properties, then hit "Save This Search" to get notified when new matches go live.</p>
          <Link href="/buyer/properties" className="btn-primary"><Search size={15} /> Browse Properties</Link>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {searches.map((s, i) => (
            <motion.div key={s._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{s.name}</p>
                  {describeFilters(s.filters) && (
                    <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{describeFilters(s.filters)}</p>
                  )}
                  <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)', opacity: 0.75 }}>
                    Saved {formatDate(s.createdAt)}{s.lastNotifiedAt ? ` · last alert ${formatDate(s.lastNotifiedAt)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggleAlerts(s)}
                    className="theme-toggle" data-dark={String(s.alertsEnabled)} aria-label="Toggle alerts"
                    title={s.alertsEnabled ? 'Alerts on' : 'Alerts off'}
                  >
                    <div className="theme-toggle__thumb" style={{ left: s.alertsEnabled ? 27 : 3 }}>
                      <Bell size={11} style={{ color: s.alertsEnabled ? 'var(--teal)' : '#94A3B8' }} />
                    </div>
                  </button>
                  <button onClick={() => remove(s)} className="btn-ghost btn-sm p-2" style={{ color: '#FB7185' }} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <Link href={`/buyer/properties?${toQueryString(s.filters)}`} className="text-xs font-medium mt-3 inline-flex items-center gap-1" style={{ color: 'var(--teal)' }}>
                View Results <ArrowRight size={12} />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
