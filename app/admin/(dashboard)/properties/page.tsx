'use client'
import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Search, Home, ChevronLeft, ChevronRight, MapPin, Calendar, UserCog,
  LayoutList, KanbanSquare, Trash2, AlertTriangle, X, Loader2, ShieldCheck, Check,
} from 'lucide-react'
import { propertyAPI, agentAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatPrice, formatDate, propertyStatusColor, cn, rentSuffix } from '@/lib/utils'
import type { Property, Agent } from '@/types'
import toast from 'react-hot-toast'

const TABS = [
  { value: '',             label: 'All'          },
  { value: 'pending',      label: 'Pending'      },
  { value: 'under_review', label: 'Under Review' },
  { value: 'published',    label: 'Published'    },
  { value: 'rejected',     label: 'Rejected'     },
  { value: 'sold',         label: 'Deal Closed'  },
]

// Same statuses as the tabs (minus "All") — these double as the Kanban columns.
const STAGES = [
  { value: 'pending',      label: 'Pending',      color: '#60A5FA' },
  { value: 'under_review', label: 'Under Review', color: '#CB0101' },
  { value: 'published',    label: 'Published',    color: '#FD7147' },
  { value: 'rejected',     label: 'Rejected',     color: '#FB7185' },
  { value: 'sold',         label: 'Deal Closed',  color: '#A855F7' },
]
// Pending/Under Review aren't things you drag a card INTO — they're either
// the starting state or something the system sets automatically when an
// already-published listing gets edited. Only these three are real,
// user-initiated transitions.
const DROPPABLE_STAGES = ['published', 'rejected', 'sold']

// ══════════════════════════ Reason modal (rejection / deletion request) ══════════════════════════

function ReasonModal({
  title, placeholder, confirmLabel, submitting, onConfirm, onClose,
}: {
  title: string; placeholder: string; confirmLabel: string; submitting: boolean
  onConfirm: (reason: string) => void; onClose: () => void
}) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose}>
      <div className="card p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{title}</h3>
          <button onClick={onClose} className="btn-ghost btn-sm p-1.5"><X size={14} /></button>
        </div>
        <textarea
          autoFocus
          className="input w-full text-sm resize-none"
          rows={3}
          placeholder={placeholder}
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flex items-center justify-end gap-2 mt-4">
          <button onClick={onClose} className="btn-ghost btn-sm">Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={submitting} className="btn-primary btn-sm gap-1.5">
            {submitting && <Loader2 size={12} className="animate-spin" />} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════ Delete / request-deletion control ══════════════════════════

function DeleteControl({
  property, isAdmin, onRequestReason, onChanged,
}: {
  property: Property; isAdmin: boolean
  onRequestReason: (property: Property) => void
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)

  if (property.deleteRequest) {
    if (!isAdmin) {
      return (
        <span className="badge badge-gray text-[10px] gap-1 flex-shrink-0">
          <AlertTriangle size={10} /> Deletion requested
        </span>
      )
    }
    const approve = async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!confirm(`Delete "${property.title}"? This cannot be undone.`)) return
      setBusy(true)
      try { await propertyAPI.approveDeleteRequest(property._id); toast.success('Listing deleted'); onChanged() }
      catch (err: any) { toast.error(err?.error || 'Failed to delete'); setBusy(false) }
    }
    const reject = async (e: React.MouseEvent) => {
      e.stopPropagation()
      setBusy(true)
      try { await propertyAPI.rejectDeleteRequest(property._id); toast.success('Deletion request declined'); onChanged() }
      catch (err: any) { toast.error(err?.error || 'Failed to decline'); setBusy(false) }
    }
    return (
      <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()} title={property.deleteRequest.reason}>
        <span className="badge badge-gray text-[10px] gap-1"><AlertTriangle size={10} /> By {property.deleteRequest.requestedBy?.name || 'agent'}</span>
        {busy ? <Loader2 size={13} className="animate-spin" style={{ color: 'var(--text-muted)' }} /> : (
          <>
            <button onClick={approve} className="btn-ghost btn-sm p-1.5" style={{ color: 'var(--green)' }} title="Approve deletion"><Check size={13} /></button>
            <button onClick={reject} className="btn-ghost btn-sm p-1.5" style={{ color: '#FB7185' }} title="Decline"><X size={13} /></button>
          </>
        )}
      </div>
    )
  }

  const directDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete "${property.title}"? This cannot be undone.`)) return
    setBusy(true)
    try { await propertyAPI.delete(property._id); toast.success('Listing deleted'); onChanged() }
    catch (err: any) { toast.error(err?.error || 'Failed to delete'); setBusy(false) }
  }

  return (
    <button
      onClick={e => { e.stopPropagation(); isAdmin ? directDelete(e) : onRequestReason(property) }}
      disabled={busy}
      className="btn-ghost btn-sm p-1.5 flex-shrink-0"
      style={{ color: isAdmin ? '#FB7185' : 'var(--text-muted)' }}
      title={isAdmin ? 'Delete listing' : 'Request deletion'}
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
    </button>
  )
}

// ══════════════════════════ Kanban ══════════════════════════

function PropertyCard({ property, isAdmin, onOpen, onDragStart, onRequestReason, onChanged }: {
  property: Property; isAdmin: boolean; onOpen: () => void; onDragStart: () => void
  onRequestReason: (p: Property) => void; onChanged: () => void
}) {
  return (
    <div
      draggable onDragStart={onDragStart}
      className="p-3 rounded-xl transition-shadow hover:shadow-md"
      style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      <div onClick={onOpen} className="cursor-pointer flex gap-2.5">
        <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-alt)' }}>
          {property.images?.[0]?.url ? (
            <img src={property.images[0].url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Home size={16} style={{ color: 'var(--teal)', opacity: 0.4 }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold line-clamp-1" style={{ color: 'var(--text)' }}>{property.title}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--teal)' }}>{formatPrice(property.price)}{rentSuffix(property)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{property.agent?.name?.split(' ')[0] || 'Unassigned'}</span>
        <DeleteControl property={property} isAdmin={isAdmin} onRequestReason={onRequestReason} onChanged={onChanged} />
      </div>
    </div>
  )
}

function PropertiesKanban({ properties, isAdmin, onOpen, onDrop, onRequestReason, onChanged }: {
  properties: Property[]; isAdmin: boolean
  onOpen: (id: string) => void
  onDrop: (property: Property, stage: string) => void
  onRequestReason: (p: Property) => void
  onChanged: () => void
}) {
  const dragItem = useRef<Property | null>(null)

  const byStage = useMemo(() => {
    const grouped: Record<string, Property[]> = {}
    STAGES.forEach(s => { grouped[s.value] = [] })
    properties.forEach(p => { (grouped[p.status] || (grouped[p.status] = [])).push(p) })
    return grouped
  }, [properties])

  return (
    <div className="flex gap-4 overflow-x-auto pb-3">
      {STAGES.map(stage => {
        const droppable = DROPPABLE_STAGES.includes(stage.value)
        return (
          <div
            key={stage.value}
            className="flex-shrink-0 w-64 rounded-2xl p-3"
            style={{ background: 'var(--bg-alt)' }}
            onDragOver={e => { if (droppable) e.preventDefault() }}
            onDrop={() => { if (droppable && dragItem.current) onDrop(dragItem.current, stage.value) }}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-bold" style={{ color: stage.color }}>{stage.label}</h3>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{byStage[stage.value]?.length || 0}</span>
            </div>
            <div className="space-y-2">
              {(byStage[stage.value] || []).map(p => (
                <PropertyCard
                  key={p._id} property={p} isAdmin={isAdmin}
                  onOpen={() => onOpen(p._id)}
                  onDragStart={() => { dragItem.current = p }}
                  onRequestReason={onRequestReason}
                  onChanged={onChanged}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ══════════════════════════ Page ══════════════════════════

function PropertiesQueue() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [q, setQ] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [kanbanProperties, setKanbanProperties] = useState<Property[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [reasonTarget, setReasonTarget] = useState<{ property: Property; mode: 'reject' | 'delete-request' } | null>(null)
  const [reasonSubmitting, setReasonSubmitting] = useState(false)
  const limit = 15

  const load = useCallback(() => {
    setLoading(true)
    propertyAPI.manageAll({ status: status || undefined, q: q || undefined, page, limit })
      .then(r => { if (r.data.success) { setProperties(r.data.data.data || []); setTotal(r.data.data.total || 0) } })
      .catch(() => toast.error('Failed to load listings'))
      .finally(() => setLoading(false))
  }, [status, q, page])

  const loadKanban = useCallback(() => {
    propertyAPI.manageAll({ q: q || undefined, limit: 300 })
      .then(r => { if (r.data.success) setKanbanProperties(r.data.data.data || []) })
      .catch(() => toast.error('Failed to load pipeline board'))
  }, [q])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (view === 'kanban') loadKanban() }, [view, loadKanban])
  useEffect(() => { agentAPI.getAll().then(r => { if (r.data.success) setAgents(r.data.data) }).catch(() => {}) }, [])

  const refreshAll = () => { load(); if (view === 'kanban') loadKanban() }

  const assignAgent = async (propertyId: string, agentUserId: string) => {
    if (!agentUserId) return
    try {
      await propertyAPI.assignAgent(propertyId, agentUserId)
      toast.success('Agent assigned')
      refreshAll()
    } catch (err: any) { toast.error(err?.error || 'Failed to assign agent') }
  }

  // Kanban drop → the matching workflow action, not a raw status write —
  // properties don't have a generic "set status" endpoint, each transition
  // has its own business rules (see STAGES/DROPPABLE_STAGES above).
  const handleDrop = async (property: Property, stage: string) => {
    if (property.status === stage) return
    try {
      if (stage === 'rejected') { setReasonTarget({ property, mode: 'reject' }); return }
      if (stage === 'published') {
        await (property.status === 'sold' ? propertyAPI.reopen(property._id) : propertyAPI.approve(property._id))
      } else if (stage === 'sold') {
        await propertyAPI.closeDeal(property._id)
      }
      toast.success('Listing updated')
      refreshAll()
    } catch (err: any) {
      toast.error(err?.error || 'That move isn\'t allowed for this listing')
    }
  }

  const confirmReason = async (reason: string) => {
    if (!reasonTarget) return
    setReasonSubmitting(true)
    try {
      if (reasonTarget.mode === 'reject') {
        await propertyAPI.reject(reasonTarget.property._id, reason)
        toast.success('Listing rejected')
      } else {
        await propertyAPI.requestDelete(reasonTarget.property._id, reason || undefined)
        toast.success('Deletion request sent to admin')
      }
      setReasonTarget(null)
      refreshAll()
    } catch (err: any) {
      toast.error(err?.error || 'Action failed')
    } finally {
      setReasonSubmitting(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <header className="flex items-center justify-between px-4 sm:px-7 py-4 flex-shrink-0 flex-wrap gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Listings</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Review and manage every property submission — tap one for details</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="input-glass w-full sm:w-64">
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              className="bg-transparent outline-none flex-1 text-sm"
              placeholder="Search title, area…"
              value={q}
              onChange={e => { setQ(e.target.value); setPage(1) }}
            />
          </div>
          <button onClick={() => setView('list')} className="btn-ghost btn-sm gap-1.5"
            style={view === 'list' ? { color: 'var(--teal)', borderColor: 'rgba(203,1,1,0.40)', background: 'rgba(203,1,1,0.06)' } : undefined}>
            <LayoutList size={13} /> List
          </button>
          <button onClick={() => setView('kanban')} className="btn-ghost btn-sm gap-1.5"
            style={view === 'kanban' ? { color: 'var(--teal)', borderColor: 'rgba(203,1,1,0.40)', background: 'rgba(203,1,1,0.06)' } : undefined}>
            <KanbanSquare size={13} /> Kanban
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-7">
        {/* Tabs — list view's status filter only, Kanban shows every status at once */}
        {view === 'list' && (
          <div className="flex items-center gap-1.5 mb-5 overflow-x-auto scrollbar-hide pb-1">
            {TABS.map(t => (
              <button
                key={t.value}
                onClick={() => { setStatus(t.value); setPage(1) }}
                className={cn('btn-ghost btn-sm flex-shrink-0', status === t.value && 'active')}
                style={status === t.value ? { color: 'var(--teal)', borderColor: 'rgba(203,1,1,0.40)', background: 'rgba(203,1,1,0.06)' } : undefined}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {view === 'kanban' ? (
          <PropertiesKanban
            properties={kanbanProperties} isAdmin={isAdmin}
            onOpen={id => router.push(`/admin/properties/${id}`)}
            onDrop={handleDrop}
            onRequestReason={p => setReasonTarget({ property: p, mode: 'delete-request' })}
            onChanged={refreshAll}
          />
        ) : loading ? (
          <div className="space-y-3">{Array(6).fill(null).map((_, i) => <div key={i} className="shimmer h-24 rounded-2xl" />)}</div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16">
            <Home size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No listings match this filter</p>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map(p => (
              <div key={p._id} className="card p-4">
                <div
                  onClick={() => router.push(`/admin/properties/${p._id}`)}
                  className="flex items-start gap-3.5 cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-alt)' }}>
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Home size={22} style={{ color: 'var(--teal)', opacity: 0.4 }} />
                    )}
                  </div>

                  {/* Core info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{p.title}</p>
                      <ChevronRight size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                    </div>
                    <p className="text-xs mt-0.5 flex items-center gap-1 truncate" style={{ color: 'var(--text-muted)' }}>
                      <MapPin size={11} className="flex-shrink-0" /> {p.location?.area || '—'} · {p.type}
                    </p>
                    <p className="text-sm font-semibold mt-1" style={{ color: 'var(--teal)' }}>{formatPrice(p.price)}{rentSuffix(p)}</p>

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className={cn('badge text-[10px]', propertyStatusColor(p.status))}>{p.status.replace('_', ' ')}</span>
                      {['pending', 'under_review'].includes(p.status) && (
                        <span
                          className={cn('badge text-[10px]', p.detailsCompleted ? 'badge-green' : 'badge-gray')}
                          title={p.detailsCompleted ? 'Agent has completed listing details' : 'Awaiting agent to complete listing details'}
                        >
                          {p.detailsCompleted ? 'Ready' : 'Incomplete'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seller / submitted / agent — a plain-language footer strip instead of dense table columns */}
                <div className="flex items-center justify-between gap-3 mt-3 pt-3 flex-wrap" style={{ borderTop: '1px solid var(--border-soft)' }}>
                  <div className="min-w-0">
                    <p className="text-xs truncate" style={{ color: 'var(--text-mid)' }}>
                      Seller: <span style={{ color: 'var(--text)' }}>{p.seller?.name || '—'}</span>
                    </p>
                    <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Calendar size={10} /> Submitted {formatDate(p.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end" onClick={e => e.stopPropagation()}>
                    {isAdmin ? (
                      <div className="flex items-center gap-1.5">
                        <UserCog size={13} style={{ color: 'var(--text-muted)' }} />
                        <select
                          className="select-field py-1.5 text-xs"
                          value={p.agent?._id || ''}
                          onChange={e => assignAgent(p._id, e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {agents.map(a => (
                            <option key={a._id} value={a.user._id}>{a.user.name}</option>
                          ))}
                        </select>
                        <span title="Admin only"><ShieldCheck size={12} style={{ color: 'var(--text-muted)' }} /></span>
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Agent: {p.agent?.name || 'Unassigned'}</p>
                    )}
                    <DeleteControl
                      property={p} isAdmin={isAdmin}
                      onRequestReason={pp => setReasonTarget({ property: pp, mode: 'delete-request' })}
                      onChanged={refreshAll}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'list' && totalPages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Page {page} of {totalPages} · {total} listings</p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost btn-sm p-2 disabled:opacity-40"><ChevronLeft size={14} /></button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-ghost btn-sm p-2 disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {reasonTarget && (
        <ReasonModal
          title={reasonTarget.mode === 'reject' ? `Reject "${reasonTarget.property.title}"` : `Request deletion of "${reasonTarget.property.title}"`}
          placeholder={reasonTarget.mode === 'reject' ? 'Why is this listing being rejected? (shown to the seller)' : 'Why should this be deleted? (shown to admin)'}
          confirmLabel={reasonTarget.mode === 'reject' ? 'Reject Listing' : 'Send Request'}
          submitting={reasonSubmitting}
          onConfirm={confirmReason}
          onClose={() => setReasonTarget(null)}
        />
      )}
    </div>
  )
}

export default function AdminPropertiesPage() {
  return (
    <Suspense fallback={null}>
      <PropertiesQueue />
    </Suspense>
  )
}
