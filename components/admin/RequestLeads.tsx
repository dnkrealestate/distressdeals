'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Calendar, ClipboardCheck, Mail, MessageCircle, Phone, Search, Trash2, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { contactAPI } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import type { ContactRequest } from '@/types'

// Leads that come from a website form with no listing attached — shown as tabs of the admin Leads page:
//   valuation_request  "Request Your Free Valuation" on /free-property-valuation-dubai
//   fast_sale_request  the form on /sell-property-fast-dubai
//   contact_form       the Contact page
export type RequestSource = ContactRequest['source']
export const REQUEST_SECTIONS: Record<RequestSource, { tab: string; title: string; badge: string; form: string; page: string; icon: any; color: string }> = {
  valuation_request: { tab: 'Valuation leads', title: 'Valuation Leads', badge: 'Valuation lead', form: '"Request Your Free Valuation" form', page: '/free-property-valuation-dubai', icon: ClipboardCheck, color: '#D97706' },
  fast_sale_request: { tab: 'Fast-sale leads', title: 'Fast-Sale Leads', badge: 'Fast-sale lead', form: '"Sell your property fast" form', page: '/sell-property-fast-dubai', icon: Zap, color: '#7C3AED' },
  contact_form: { tab: 'Contact messages', title: 'Contact Messages', badge: 'Contact message', form: 'Contact page form', page: '/contact', icon: Mail, color: '#2563EB' },
}
const STATUSES = ['new', 'contacted', 'closed'] as const
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

export default function RequestLeads({ source, onChanged }: { source: RequestSource; onChanged?: () => void }) {
  const info = REQUEST_SECTIONS[source]
  const [status, setStatus] = useState<typeof STATUSES[number]>('new')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<ContactRequest[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const debounce = useRef<ReturnType<typeof setTimeout>>()

  const load = useCallback(() => {
    setLoading(true)
    contactAPI.adminList({ source, status, q: query.trim() || undefined, page })
      .then(r => { const d = r.data.data; setRows(d.data || []); setTotal(d.total || 0); setTotalPages(d.totalPages || 1); setCounts(d.counts || {}) })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [source, status, query, page])

  useEffect(() => {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(load, query ? 350 : 0)
    return () => clearTimeout(debounce.current)
  }, [load, query])
  useEffect(() => { setPage(1) }, [source, status, query])
  useEffect(() => { setStatus('new'); setQuery('') }, [source])

  const replace = (r: ContactRequest) => setRows(list => list.map(x => (x._id === r._id ? r : x)))
  const setRequestStatus = async (r: ContactRequest, next: string) => {
    try { await contactAPI.adminUpdate(r._id, { status: next }); toast.success(`Marked ${next}`); load(); onChanged?.() }
    catch (err: any) { toast.error(err?.error || 'Failed to update') }
  }
  const remove = async (r: ContactRequest) => {
    if (!confirm(`Delete the ${info.badge.toLowerCase()} from "${r.name}"? This cannot be undone.`)) return
    try { await contactAPI.adminDelete(r._id); toast.success('Deleted'); load(); onChanged?.() }
    catch (err: any) { toast.error(err?.error || 'Failed to delete') }
  }

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-3 px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{info.title}</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Sent from the {info.form} on <a href={info.page} target="_blank" rel="noreferrer" style={{ color: 'var(--teal)' }}>{info.page}</a>. Each one is also emailed to the admin inbox.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input w-full pl-9" placeholder="Search name, email, phone or message" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </header>

      <div className="p-7">
        <div className="flex items-center gap-1.5 mb-5">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)} className="btn-ghost btn-sm capitalize"
              style={status === s ? { color: 'var(--teal)', borderColor: 'rgba(203,1,1,0.40)', background: 'rgba(203,1,1,0.06)' } : undefined}>
              {s} <span className="ml-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>{counts[s] || 0}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-28 rounded-2xl" />)}</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16">
            <info.icon size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{query ? 'Nothing matches your search' : `No ${status} ${info.tab.toLowerCase()}`}</p>
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
                        {/* Says at a glance which form this lead came from. */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide" style={{ background: `${info.color}1F`, color: info.color }}>
                          <info.icon size={10} /> {info.badge}
                        </span>
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
                      <button onClick={() => remove(r)} className="btn-ghost btn-sm p-2" style={{ color: '#FB7185' }} aria-label="Delete"><Trash2 size={13} /></button>
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
                Page {page} of {totalPages} · {total} in total
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-ghost btn-sm disabled:opacity-40">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
