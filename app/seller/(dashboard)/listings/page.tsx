'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, TrendingUp, Plus, Eye, Heart,
  Search, MoreVertical, Pencil, Trash2, XCircle,
  AlertCircle, Building2, Clock, MessageSquare, Loader2, Sparkles,
} from 'lucide-react'
import { propertyAPI, chatAPI } from '@/lib/api'
import { formatPrice, formatDate, cn, rentSuffix } from '@/lib/utils'
import type { Property } from '@/types'
import toast from 'react-hot-toast'

const STATUS_TABS = [
  { v: '',             l: 'All'           },
  { v: 'published',    l: 'Active'        },
  { v: 'pending',      l: 'Pending'       },
  { v: 'under_review', l: 'Under Review'  },
  { v: 'rejected',     l: 'Rejected'      },
  { v: 'draft',        l: 'Drafts'        },
]

const STATUS_BADGE: Record<string, string> = {
  published:     'badge-green',
  pending:        'badge-blue',
  under_review:   'badge-blue',
  rejected:       'badge-red',
  draft:          'badge-gray',
}

const STATUS_LABEL: Record<string, string> = {
  published:    'Active',
  pending:      'Pending',
  under_review: 'Under Review',
  rejected:     'Rejected',
  draft:        'Draft',
}

/* ─── ACTION MENU ───────────────────────────────────────────── */
function ActionMenu({ property, onCancel, onDelete }: { property: Property; onCancel: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="btn-ghost p-2">
        <MoreVertical size={15} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-44 rounded-xl overflow-hidden z-50 shadow-lg"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <Link
                href={`/seller/listings/${property._id}/edit`}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors"
                style={{ color: 'var(--text-mid)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(49,178,222,0.06)'; (e.currentTarget as HTMLElement).style.color = 'var(--teal)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-mid)' }}
              >
                <Pencil size={14} /> Edit Listing
              </Link>
              {property.status === 'published' && (
                <button
                  onClick={() => { setOpen(false); onCancel() }}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm w-full transition-colors"
                  style={{ color: '#FBBF24' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(251,191,36,0.08)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <XCircle size={14} /> Cancel Listing
                </button>
              )}
              <button
                onClick={() => { setOpen(false); onDelete() }}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm w-full transition-colors"
                style={{ color: '#FB7185', borderTop: '1px solid var(--border)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(244,63,94,0.08)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── PAGE ──────────────────────────────────────────────────── */
export default function SellerListingsPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Property[]>([])
  const [loading,  setLoading]  = useState(true)
  const [statusTab, setStatusTab] = useState('')
  const [query, setQuery] = useState('')
  const [messaging, setMessaging] = useState<string | null>(null)

  const fetchListings = () => {
    setLoading(true)
    propertyAPI.myListings({ limit: 50 })
      .then(r => { if (r.data.success) setListings(r.data.data.data || []) })
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchListings() }, [])

  const handleCancel = async (p: Property) => {
    try {
      await propertyAPI.update(p._id, { status: 'draft' } as any)
      toast.success('Listing cancelled and moved to drafts')
      setListings(ls => ls.map(l => l._id === p._id ? { ...l, status: 'draft' } as Property : l))
    } catch {
      toast.error('Failed to cancel listing')
    }
  }

  const handleDelete = async (p: Property) => {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return
    try {
      await propertyAPI.delete(p._id)
      toast.success('Listing deleted')
      setListings(ls => ls.filter(l => l._id !== p._id))
    } catch {
      toast.error('Failed to delete listing')
    }
  }

  const messageAgent = async (e: React.MouseEvent, p: Property) => {
    e.preventDefault()
    if (!p.agent) return
    setMessaging(p._id)
    try {
      const res = await chatAPI.createRoom({ type: 'seller_agent', participantId: p.agent._id, property: p._id })
      router.push(`/seller/messages?room=${res.data.data._id}`)
    } catch {
      toast.error('Failed to open conversation')
    } finally {
      setMessaging(null)
    }
  }

  const filtered = listings.filter(p => {
    if (statusTab && p.status !== statusTab) return false
    if (query && !p.title.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  const counts: Record<string, number> = {}
  STATUS_TABS.forEach(t => { counts[t.v] = t.v ? listings.filter(p => p.status === t.v).length : listings.length })

  return (
    <div>
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 sm:px-7 py-4 flex-shrink-0 flex-wrap gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>My Listings</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {loading ? 'Loading…' : `${listings.length} total propert${listings.length === 1 ? 'y' : 'ies'}`}
          </p>
        </div>
        <Link href="/seller/listings/new" className="btn-primary btn-sm gap-2">
          <Plus size={13} /> Add Listing
        </Link>
      </header>

      {/* Content */}
      <div className="p-4 sm:p-7">

        {/* First-time welcome — the one thing a new seller needs to do */}
        {!loading && listings.length === 0 && (
          <Link
            href="/seller/listings/new"
            className="flex flex-col items-center text-center gap-4 rounded-3xl p-8 sm:p-10 mb-6 transition-transform active:scale-[0.99]"
            style={{ background: 'var(--grad)' }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <Sparkles size={26} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1.5">List your first property</h2>
              <p className="text-sm text-white/85 max-w-sm">
                Takes about 5 minutes. Our team reviews and publishes it for you — no fees to list.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold" style={{ background: 'white', color: 'var(--teal)' }}>
              <Plus size={15} /> Add Your Property
            </span>
          </Link>
        )}

        {/* Search + status tabs — nothing to filter yet on a brand new account */}
        {(loading || listings.length > 0) && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {STATUS_TABS.map(t => (
              <button
                key={t.v}
                onClick={() => setStatusTab(t.v)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap border transition-all flex-shrink-0"
                style={{
                  borderColor: statusTab === t.v ? 'var(--teal)' : 'var(--border)',
                  background:  statusTab === t.v ? 'rgba(49,178,222,0.10)' : 'transparent',
                  color:       statusTab === t.v ? 'var(--teal)' : 'var(--text-muted)',
                }}
              >
                {t.l}
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    background: statusTab === t.v ? 'var(--grad)' : 'var(--bg-alt)',
                    color: statusTab === t.v ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {counts[t.v]}
                </span>
              </button>
            ))}
          </div>

          <div className="input-glass flex items-center gap-2 h-10 px-3 rounded-xl flex-shrink-0 w-full md:w-64">
            <Search size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search listings…"
              className="bg-transparent flex-1 text-sm outline-none"
              style={{ color: 'var(--text)' }}
            />
          </div>
        </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {Array(5).fill(null).map((_, i) => <div key={i} className="shimmer h-20 rounded-2xl" />)}
          </div>
        ) : listings.length === 0 ? null : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(49,178,222,0.08)', border: '1px solid rgba(49,178,222,0.20)' }}>
              <Building2 size={24} style={{ color: 'var(--teal)' }} />
            </div>
            <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>No matching listings</h3>
            <p className="muted mb-6 max-w-xs">Try a different filter or search term.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p, i) => (
              <motion.div key={p._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="card p-4 flex items-center gap-4 flex-wrap sm:flex-nowrap">

                  {/* Thumbnail */}
                  <Link href={`/seller/listings/${p._id}`} className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 size={24} style={{ color: 'var(--teal)', opacity: 0.4 }} />
                    )}
                  </Link>

                  {/* Info */}
                  <Link href={`/seller/listings/${p._id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{p.title}</h3>
                      <span className={cn('badge text-[10px]', STATUS_BADGE[p.status] || 'badge-gray')}>
                        {STATUS_LABEL[p.status] || p.status}
                      </span>
                      {p.isFeatured && <span className="badge badge-teal text-[10px]">✦ Featured</span>}
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {p.location?.area}, {p.location?.city} · {formatPrice(p.price)}
                      {rentSuffix(p)}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                      Listed {formatDate(p.createdAt)}
                    </p>
                  </Link>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-5 flex-shrink-0 text-xs" style={{ color: 'var(--text-mid)' }}>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="flex items-center gap-1 font-semibold"><Eye size={13} style={{ color: 'var(--teal)' }} />{p.stats?.views || 0}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Views</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="flex items-center gap-1 font-semibold"><TrendingUp size={13} style={{ color: 'var(--green)' }} />{p.stats?.leads || 0}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Leads</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="flex items-center gap-1 font-semibold"><Heart size={13} style={{ color: '#FB7185' }} />{p.stats?.favorites || 0}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Saved</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <ActionMenu property={p} onCancel={() => handleCancel(p)} onDelete={() => handleDelete(p)} />
                </div>

                {/* Rejection reason */}
                {p.status === 'rejected' && (
                  <div className="mt-2 flex items-center justify-between gap-2.5 px-4 py-2.5 rounded-xl text-xs flex-wrap" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.18)', color: '#FB7185' }}>
                    <span className="flex items-start gap-2.5">
                      <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                      <span>{(p as any).rejectionReason || 'This listing was not approved.'}</span>
                    </span>
                    <Link href={`/seller/listings/${p._id}/edit`} className="btn-ghost btn-sm flex-shrink-0" style={{ color: '#FB7185' }}>
                      Fix &amp; Resubmit
                    </Link>
                  </div>
                )}

                {/* Pending review — assigned agent + message */}
                {(p.status === 'pending' || p.status === 'under_review') && (
                  <div className="mt-2 flex items-center justify-between gap-2.5 px-4 py-2.5 rounded-xl text-xs flex-wrap" style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.18)', color: 'var(--text-mid)' }}>
                    <span className="flex items-center gap-2">
                      <Clock size={13} style={{ color: 'var(--teal)' }} className="flex-shrink-0" />
                      {p.agent ? <>Assigned to <strong style={{ color: 'var(--text)' }}>{p.agent.name}</strong> — review in progress</> : 'Approval in progress — assigning an agent'}
                    </span>
                    {p.agent && (
                      <button onClick={e => messageAgent(e, p)} disabled={messaging === p._id} className="btn-ghost btn-sm gap-1.5 text-xs">
                        {messaging === p._id ? <Loader2 size={12} className="animate-spin" /> : <MessageSquare size={12} />}
                        Message Agent
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
