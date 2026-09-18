'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { CalendarClock, Search, MapPin, Video, Phone as PhoneIcon, Building2, X } from 'lucide-react'
import { meetingAPI } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import type { Meeting } from '@/types'
import toast from 'react-hot-toast'

const TYPE_META: Record<string, { icon: any; label: string }> = {
  property_tour: { icon: Building2, label: 'Property Tour' },
  office_meeting: { icon: MapPin,   label: 'Office Meeting' },
  virtual:        { icon: Video,    label: 'Virtual Meeting' },
  phone_call:     { icon: PhoneIcon,label: 'Phone Call' },
}
const STATUS_BADGE: Record<string, string> = {
  scheduled: 'badge-blue', confirmed: 'badge-teal', completed: 'badge-green', cancelled: 'badge-gray', no_show: 'badge-gray',
}

export default function BuyerToursPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    meetingAPI.getAll({ limit: 50 })
      .then(r => { if (r.data.success) setMeetings(r.data.data.data || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const cancelMeeting = async (id: string) => {
    if (!confirm('Cancel this scheduled meeting?')) return
    setCancelingId(id)
    try {
      await meetingAPI.cancel(id)
      toast.success('Meeting cancelled')
      load()
    } catch (err: any) {
      toast.error(err?.error || 'Failed to cancel meeting')
    } finally {
      setCancelingId(null)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md mb-1">My <span className="grad-text">Tours</span></h1>
        <p className="muted">{loading ? 'Loading…' : `${meetings.length} scheduled or past meeting${meetings.length === 1 ? '' : 's'}`}</p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-24 rounded-2xl" />)}</div>
      ) : meetings.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center card">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(203,1,1,0.08)', border: '1px solid rgba(203,1,1,0.20)' }}>
            <CalendarClock size={28} style={{ color: 'var(--teal)' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>No tours scheduled</h3>
          <p className="muted mb-7 max-w-xs">Once your agent schedules a viewing or call with you, it'll appear here.</p>
          <Link href="/buyer/properties" className="btn-primary"><Search size={15} /> Browse Properties</Link>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting, i) => {
            const meta = TYPE_META[meeting.type] || TYPE_META.property_tour
            const canCancel = meeting.status === 'scheduled' || meeting.status === 'confirmed'
            return (
              <motion.div key={meeting._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.08)', border: '1px solid rgba(203,1,1,0.20)' }}>
                  <meta.icon size={17} style={{ color: 'var(--teal)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                    {meeting.property?.title || meta.label}
                  </p>
                  <div className="flex items-center gap-3 text-xs mt-1 flex-wrap" style={{ color: 'var(--text-muted)' }}>
                    <span>{meta.label}</span>
                    <span className="flex items-center gap-1"><CalendarClock size={10} />{formatDate(meeting.scheduledAt)}</span>
                    {meeting.agent?.name && <span>with {meeting.agent.name}</span>}
                  </div>
                </div>
                <span className={cn('badge flex-shrink-0 capitalize', STATUS_BADGE[meeting.status] || 'badge-gray')}>{meeting.status.replace('_', ' ')}</span>
                {canCancel && (
                  <button onClick={() => cancelMeeting(meeting._id)} disabled={cancelingId === meeting._id}
                    className="btn-ghost btn-sm p-2 flex-shrink-0" style={{ color: '#FB7185' }} title="Cancel meeting">
                    <X size={14} />
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
