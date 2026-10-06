'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Calendar, ClipboardCheck, Inbox, Mail, MessageCircle, Phone, Search, Tag, Trash2, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { contactAPI } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import type { ContactRequest } from '@/types'

// Requests sent from the website's forms with no listing attached: "Request Your Free Valuation"
// (/free-property-valuation-dubai), "Sell your property fast" (/sell-property-fast-dubai) and the Contact page.
const SOURCES: { key: ContactRequest['source'] | ''; label: string; icon: any; page?: string }[] = [
  { key: 'valuation_request', label: 'Valuation requests', icon: ClipboardCheck, page: '/free-property-valuation-dubai' },
  { key: 'fast_sale_request', label: 'Fast-sale requests', icon: Zap, page: '/sell-property-fast-dubai' },
  { key: 'contact_form', label: 'Contact messages', icon: Mail, page: '/contact' },
  { key: '', label: 'All requests', icon: Inbox },
]
const STATUSES = ['new', 'contacted', 'closed'] as const
const SOURCE_TAG: Record<string, string> = { valuation_request: 'Valuation', fast_sale_request: 'Fast sale', contact_form: 'Contact' }
const waNumber = (phone?: string) => (phone || '').replace(/[^\d]/g, '').replace(/^00/, '')

function NoteBox({ request, onSaved }: { request: ContactRequest; onSaved: (r: ContactRequest) => void }) {
  const [note, setNote] = useState(request.note || '')
  const [saving, setSaving] = useState(false)
  const changed = note.trim() !== (request.note || '').trim()
  const save = async () => {
    setSaving(true)
    try { const r = await contactAPI.adminUpdate(request._id, { note }); onSaved(r.data.data); toast.success('Note saved') }
    catch (err: any) { toast.error(err?.error || 'Failed to save the note') }
    finally { setSaving(false) }
  }
  return (
    <div className="flex items-start gap-2 mt-3">
      <textarea className="input flex-1 text-xs" rows={1} placeholder="Private note for the team (who called, what was agreed…)" value={note} onChange={e => setNote(e.target.value)} />
      {changed && <button onClick={save} disabled={saving} className="btn-primary btn-sm flex-shrink-0">{saving ? 'Saving…' : 'Save note'}</button>}
    </div>
  )
}

export default function AdminRequestsPage() {
  const [source, setSource] = useState<ContactRequest['source'] | ''>('valuation_request')
  const [status, setStatus] = useState<typeof STATUSES[number]>('new')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<ContactRequest[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [newBySource, setNewBySource] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const debounce = useRef<ReturnType<typeof setTimeout>>()

  const load = useCallback(() => {
    setLoading(true)
    contactAPI.adminList({ source: source || undefined, status, q: query.trim() || undefined, page })
      .then(r => {
        const d = r.data.data
        setRows(d.data || []); setTotal(d.total || 0); setTotalPages(d.totalPages || 1); setCounts(d.counts || {}); setNewBySource(d.newBySource || {})
      })
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false))
  }, [source, status, query, page])

  useEffect(() => {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(load, query ? 350 : 0)
    return () => clearTimeout(debounce.current)
  }, [load, query])
  useEffect(() => { setPage(1) }, [source, status, query])

  const replace = (r: ContactRequest) => setRows(list => list.map(x => (x._id === r._id ? r : x)))
  const setRequestStatus = async (r: ContactRequest, next: string) => {
    try { await contactAPI.adminUpdate(r._id, { status: next }); toast.success(`Marked ${next}`); load() }
    catch (err: any) { toast.error(err?.error || 'Failed to update') }
  }
  const remove = async (r: ContactRequest) => {
    if (!confirm(`Delete the request from "${r.name}"? This cannot be undone.`)) return
    try { await contactAPI.adminDelete(r._id); toast.success('Deleted'); load() }
    catch (err: any) { toast.error(err?.error || 'Failed to delete') }
  }
  const active = SOURCES.find(s => s.key === source)!

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-3 px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Requests</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Free valuation, fast-sale and contact form requests from the website{active.page ? <> — this tab: <a href={active.page} target="_blank" rel="noreferrer" style={{ color: 'var(--teal)' }}>{active.page}</a></> : null}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input w-full pl-9" placeholder="Search name, email, phone or message" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </header>

      <div className="p-7">
        {/* Which form */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {SOURCES.map(s => {
            const on = s.key === source
            const fresh = s.key ? newBySource[s.key] || 0 : Object.values(newBySource).reduce((a, b) => a + b, 0)
            return (
              <button key={s.label} onClick={() => setSource(s.key)} className="btn-ghost btn-sm gap-1.5"
                style={on ? { color: 'var(--teal)', borderColor: 'rgba(203,1,1,0.40)', background: 'rgba(203,1,1,0.06)' } : undefined}>
                <s.icon size={13} /> {s.label}
                {fresh > 0 && <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background: 'var(--teal)' }}>{fresh}</span>}
              </button>
            )
          })}
        </div>
        {/* Where it stands */}
        <div className="flex items-center gap-1.5 mb-5">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)} className="btn-ghost btn-sm capitalize"
              style={status === s ? { color: 'var(--text)', borderColor: 'var(--text-muted)', background: 'var(--bg-alt)' } : undefined}>
              {s} <span className="ml-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>{counts[s] || 0}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-28 rounded-2xl" />)}</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16">
            <active.icon size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{query ? 'Nothing matches your search' : `No ${status} ${active.key ? active.label.toLowerCase() : 'requests'}`}</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {rows.map(r => (
                <div key={r._id} className="card p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold flex items-center gap-2 flex-wrap" style={{ color: 'var(--text)' }}>
                        {r.name}
                        {!source && <span className="badge text-[10px] gap-1"><Tag size={10} /> {SOURCE_TAG[r.source] || r.source}</span>}
                      </p>
                      <div className="flex items-center gap-4 text-xs mt-1.5 flex-wrap" style={{ color: 'var(--text-muted)' }}>
                        <a href={`mailto:${r.email}`} className="flex items-center gap-1.5 hover:opacity-80"><Mail size={11} />{r.email}</a>
                        {r.phone && <a href={`tel:${r.phone}`} className="flex items-center gap-1.5 hover:opacity-80"><Phone size={11} />{r.phone}</a>}
                        {r.phone && <a href={`https://wa.me/${waNumber(r.phone)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:opacity-80"><MessageCircle size={11} />WhatsApp</a>}
                        <span className="flex items-center gap-1.5"><Calendar size={11} />{formatDateTime(r.createdAt)}</span>
                        {r.handledBy?.name && <span>Handled by {r.handledBy.name}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {STATUSES.filter(s => s !== (r.status || 'new')).map(s => (
                        <button key={s} onClick={() => setRequestStatus(r, s)} className="btn-ghost btn-sm capitalize" style={{ fontSize: 11 }}>Mark {s}</button>
                      ))}
                      <button onClick={() => remove(r)} className="btn-ghost btn-sm p-2" style={{ color: '#FB7185' }} aria-label="Delete request"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <p className="text-sm mt-3 pt-3 whitespace-pre-line" style={{ color: 'var(--text-mid)', borderTop: '1px solid var(--border)' }}>{r.message}</p>
                  <NoteBox request={r} onSaved={replace} />
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost btn-sm disabled:opacity-40">Previous</button>
                Page {page} of {totalPages} · {total} requests
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-ghost btn-sm disabled:opacity-40">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
