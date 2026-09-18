'use client'
import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, CheckCircle2, XCircle } from 'lucide-react'
import { meetingAPI } from '@/lib/api'
import { formatDateTime, cn } from '@/lib/utils'
import type { Meeting } from '@/types'
import toast from 'react-hot-toast'

const STATUS_TABS = [
  { value: '',            label: 'All'       },
  { value: 'scheduled',   label: 'Scheduled' },
  { value: 'confirmed',   label: 'Confirmed' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
  { value: 'no_show',     label: 'No Show'   },
]

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'badge-blue', confirmed: 'badge-teal', completed: 'badge-green',
  cancelled: 'badge-red', no_show: 'badge-gray',
}

export default function AdminMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    meetingAPI.getAll({ status: status || undefined, limit: 100 })
      .then(r => { if (r.data.success) setMeetings(r.data.data.data || []) })
      .catch(() => toast.error('Failed to load meetings'))
      .finally(() => setLoading(false))
  }, [status])

  useEffect(() => { load() }, [load])

  const complete = async (id: string) => {
    try { await meetingAPI.complete(id); toast.success('Meeting marked complete'); load() }
    catch (err: any) { toast.error(err?.error || 'Failed to update') }
  }

  const cancel = async (id: string) => {
    if (!confirm('Cancel this meeting?')) return
    try { await meetingAPI.cancel(id); toast.success('Meeting cancelled'); load() }
    catch (err: any) { toast.error(err?.error || 'Failed to cancel') }
  }

  return (
    <div>
      <header className="flex items-center justify-between px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Meetings</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>All scheduled tours and viewings</p>
        </div>
      </header>

      <div className="p-7">
        <div className="flex items-center gap-1.5 mb-5 flex-wrap">
          {STATUS_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setStatus(t.value)}
              className="btn-ghost btn-sm"
              style={status === t.value ? { color: 'var(--teal)', borderColor: 'rgba(203,1,1,0.40)', background: 'rgba(203,1,1,0.06)' } : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-3">{Array(6).fill(null).map((_, i) => <div key={i} className="shimmer h-12 rounded-xl" />)}</div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-16">
              <CalendarDays size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No meetings match this filter</p>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Buyer</th>
                  <th>Agent</th>
                  <th>Type</th>
                  <th>Scheduled</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {meetings.map(m => (
                  <tr key={m._id}>
                    <td className="text-sm truncate max-w-[180px]" style={{ color: 'var(--text)' }}>{(m.property as any)?.title || '—'}</td>
                    <td className="text-sm" style={{ color: 'var(--text)' }}>{(m.buyer as any)?.name || '—'}</td>
                    <td className="text-sm" style={{ color: 'var(--text)' }}>{(m.agent as any)?.name || '—'}</td>
                    <td className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{m.type?.replace('_', ' ')}</td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDateTime(m.scheduledAt)}</td>
                    <td><span className={cn('badge', STATUS_BADGE[m.status] || 'badge-gray')}>{m.status.replace('_', ' ')}</span></td>
                    <td>
                      {['scheduled', 'confirmed'].includes(m.status) && (
                        <div className="flex items-center gap-1.5 justify-end">
                          <button onClick={() => complete(m._id)} className="btn-ghost btn-sm p-2" style={{ color: 'var(--green)' }} title="Mark complete">
                            <CheckCircle2 size={13} />
                          </button>
                          <button onClick={() => cancel(m._id)} className="btn-ghost btn-sm p-2" style={{ color: '#FB7185' }} title="Cancel">
                            <XCircle size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
