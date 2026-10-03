'use client'
import { useState, useEffect, useCallback } from 'react'
import { Star, Check, X, Trash2, MessageSquareReply, Search, ExternalLink } from 'lucide-react'
import { reviewAPI } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import type { Review } from '@/types'
import toast from 'react-hot-toast'

// Review moderation — every review left on a place, area, community, building or article. New reviews wait here
// until approved; staff can also reply publicly, reject or delete.

const TYPES: Record<string, string> = { place: 'UAE Explore', area: 'Area', community: 'Community', building: 'Building', blog: 'Blog', news: 'News' }
const STATUS = [['pending', 'Waiting'], ['approved', 'Published'], ['rejected', 'Rejected'], ['', 'All']] as const
const pageHref = (r: Review) =>
  r.targetType === 'place' ? `/explore/attractions/${r.targetSlug}`   // redirects to the place's own section
  : r.targetType === 'area' ? `/areas/${r.targetSlug}` : r.targetType === 'community' ? `/communities/${r.targetSlug}`
  : r.targetType === 'building' ? `/buildings/${r.targetSlug}` : `/${r.targetType}/${r.targetSlug}`

export default function AdminReviewsPage() {
  const [status, setStatus] = useState<string>('pending')
  const [type, setType] = useState('')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ data: Review[]; total: number; pending: number; totalPages: number } | null>(null)
  const [replying, setReplying] = useState<string | null>(null)
  const [reply, setReply] = useState('')

  const load = useCallback(() => {
    reviewAPI.getAllAdmin({ status: status || undefined, type: type || undefined, q: search || undefined, page })
      .then(r => setData(r.data.data)).catch(() => toast.error('Failed to load reviews'))
  }, [status, type, search, page])
  useEffect(() => { load() }, [load])
  useEffect(() => { const t = setTimeout(() => { setSearch(q.trim()); setPage(1) }, 350); return () => clearTimeout(t) }, [q])

  const act = async (r: Review, patch: { status?: string; reply?: string }, done: string) => {
    try { await reviewAPI.moderate(r._id, patch); toast.success(done); setReplying(null); load() }
    catch (err: any) { toast.error(err?.response?.data?.error || 'Could not update') }
  }
  const remove = async (r: Review) => {
    if (!confirm('Delete this review for good?')) return
    try { await reviewAPI.delete(r._id); toast.success('Deleted'); load() } catch { toast.error('Could not delete') }
  }

  return (
    <div>
      <header className="px-7 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Reviews</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Reviews and ratings from visitors{data ? ` — ${data.pending} waiting to be checked` : ''}. A review appears on the site only after it is approved.
        </p>
      </header>

      <div className="p-4 sm:p-7">
        <div className="flex flex-wrap gap-2 mb-4">
          {STATUS.map(([v, l]) => (
            <button key={v || 'all'} onClick={() => { setStatus(v); setPage(1) }} className="px-3.5 h-9 rounded-full text-xs font-semibold"
              style={status === v ? { background: 'var(--grad)', color: '#fff' } : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}>
              {l}{v === 'pending' && data?.pending ? ` (${data.pending})` : ''}
            </button>
          ))}
          <select className="select-field ml-auto" style={{ width: 'auto' }} value={type} onChange={e => { setType(e.target.value); setPage(1) }}>
            <option value="">All pages</option>
            {Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <label className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input className="input pl-9" placeholder="Search page, person or text…" value={q} onChange={e => setQ(e.target.value)} />
          </label>
        </div>

        {!data ? (
          <div className="space-y-3">{Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-24 rounded-2xl" />)}</div>
        ) : data.data.length === 0 ? (
          <div className="text-center py-16">
            <Star size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{status === 'pending' ? 'Nothing waiting — all caught up' : 'No reviews here'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.data.map(r => (
              <div key={r._id} className="card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold flex items-center gap-2 flex-wrap" style={{ color: 'var(--text)' }}>
                      <a href={pageHref(r)} target="_blank" rel="noreferrer" className="hover:underline inline-flex items-center gap-1">{r.targetName || r.targetSlug} <ExternalLink size={11} /></a>
                      <span className="badge badge-gray text-[10px]">{TYPES[r.targetType]}</span>
                      <span className={`badge text-[10px] ${r.status === 'approved' ? 'badge-green' : r.status === 'rejected' ? 'badge-red' : 'badge-blue'}`}>
                        {r.status === 'approved' ? 'Published' : r.status === 'rejected' ? 'Rejected' : 'Waiting'}
                      </span>
                    </p>
                    <p className="text-xs mt-1 flex items-center gap-2 flex-wrap" style={{ color: 'var(--text-muted)' }}>
                      <span className="inline-flex">{[1, 2, 3, 4, 5].map(n => <Star key={n} size={12} fill={n <= r.rating ? '#F59E0B' : 'transparent'} stroke={n <= r.rating ? '#F59E0B' : 'var(--border)'} />)}</span>
                      <span>{r.authorName}{r.user?.email ? ` · ${r.user.email}` : ''}</span>
                      <span>{formatDateTime(r.createdAt)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {r.status !== 'approved' && <button onClick={() => act(r, { status: 'approved' }, 'Published')} className="btn-primary btn-sm gap-1.5"><Check size={13} /> Approve</button>}
                    {r.status !== 'rejected' && <button onClick={() => act(r, { status: 'rejected' }, 'Rejected')} className="btn-outline btn-sm gap-1.5"><X size={13} /> Reject</button>}
                    <button title="Reply" onClick={() => { setReplying(replying === r._id ? null : r._id); setReply(r.reply || '') }} className="btn-ghost btn-sm p-2"><MessageSquareReply size={14} /></button>
                    <button title="Delete" onClick={() => remove(r)} className="btn-ghost btn-sm p-2" style={{ color: '#FB7185' }}><Trash2 size={13} /></button>
                  </div>
                </div>
                {r.title && <p className="text-sm font-semibold mt-3" style={{ color: 'var(--text)' }}>{r.title}</p>}
                <p className="text-sm mt-1.5 whitespace-pre-line" style={{ color: 'var(--text-mid)', overflowWrap: 'anywhere' }}>{r.comment}</p>
                {r.reply && replying !== r._id && (
                  <p className="text-xs mt-3 pl-3" style={{ borderLeft: '2px solid var(--teal)', color: 'var(--text-mid)' }}><b>Our reply:</b> {r.reply}</p>
                )}
                {replying === r._id && (
                  <div className="mt-3 space-y-2">
                    <textarea className="input" rows={3} maxLength={1000} placeholder="A public reply, shown under the review…" value={reply} onChange={e => setReply(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={() => act(r, { reply }, reply.trim() ? 'Reply saved' : 'Reply removed')} className="btn-primary btn-sm">Save reply</button>
                      <button onClick={() => setReplying(null)} className="btn-outline btn-sm">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-outline btn-sm">Previous</button>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Page {page} of {data.totalPages}</span>
            <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)} className="btn-outline btn-sm">Next</button>
          </div>
        )}
      </div>
    </div>
  )
}
