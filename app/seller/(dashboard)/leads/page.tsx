'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TrendingUp, MessageSquare } from 'lucide-react'
import { leadAPI, chatAPI } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import type { Lead } from '@/types'
import toast from 'react-hot-toast'

const STATUS_TABS = [
  { v: '',            l: 'All'         },
  { v: 'new',          l: 'New'         },
  { v: 'contacted',    l: 'Contacted'   },
  { v: 'qualified',    l: 'Qualified'   },
  { v: 'touring',      l: 'Touring'     },
  { v: 'negotiating',  l: 'Negotiating' },
  { v: 'deal_closed',  l: 'Closed'      },
  { v: 'deal_lost',    l: 'Lost'        },
]

const STATUS_BADGE: Record<string, string> = {
  new: 'badge-blue', contacted: 'badge-teal', qualified: 'badge-teal',
  touring: 'badge-purple', negotiating: 'badge-blue',
  deal_closed: 'badge-green', deal_lost: 'badge-red', cancelled: 'badge-gray',
}

export default function SellerLeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [messaging, setMessaging] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    leadAPI.myLeads({ limit: 100 })
      .then(r => { if (r.data.success) setLeads(r.data.data.data || []) })
      .catch(() => toast.error('Failed to load leads'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = status ? leads.filter(l => l.status === status) : leads

  const messageAgent = async (e: React.MouseEvent, lead: Lead) => {
    e.preventDefault()
    if (!lead.assignedAgent) { toast.error('No agent assigned to this lead yet'); return }
    setMessaging(lead._id)
    try {
      const res = await chatAPI.createRoom({
        type: 'seller_agent',
        participantId: lead.assignedAgent._id,
        property: (lead.property as any)?._id,
        lead: lead._id,
      })
      router.push(`/seller/messages?room=${res.data.data._id}`)
    } catch {
      toast.error('Failed to open conversation')
    } finally {
      setMessaging(null)
    }
  }

  return (
    <div>
      <header className="px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Leads</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Buyer interest across your listings — identities are managed by our team
        </p>
      </header>

      <div className="p-7">
        <div className="flex items-center gap-1.5 mb-5 flex-wrap">
          {STATUS_TABS.map(t => (
            <button
              key={t.v}
              onClick={() => setStatus(t.v)}
              className="btn-ghost btn-sm"
              style={status === t.v ? { color: 'var(--teal)', borderColor: 'rgba(49,178,222,0.40)', background: 'rgba(49,178,222,0.06)' } : undefined}
            >
              {t.l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{Array(5).fill(null).map((_, i) => <div key={i} className="shimmer h-16 rounded-2xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <TrendingUp size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No leads yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>Leads appear once your listings are approved and buyers show interest</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(lead => (
              <Link key={lead._id} href={`/seller/listings/${(lead.property as any)?._id}`} className="card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: 'var(--grad)' }}>
                  {lead.buyer?.name?.[0] || 'B'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{lead.buyer?.name || 'Interested Buyer'}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{(lead.property as any)?.title || 'Property'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={cn('badge text-xs', STATUS_BADGE[lead.status] || 'badge-gray')}>{lead.status.replace('_', ' ')}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{formatDate(lead.createdAt)}</span>
                </div>
                {lead.assignedAgent && (
                  <button
                    onClick={e => messageAgent(e, lead)}
                    disabled={messaging === lead._id}
                    className="btn-ghost btn-sm p-2 flex-shrink-0"
                    title="Message agent"
                  >
                    <MessageSquare size={14} />
                  </button>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
