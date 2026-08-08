'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { TrendingUp, Search, Calendar, Building2, MapPin } from 'lucide-react'
import { leadAPI } from '@/lib/api'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import type { Lead } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  new: 'New', contacted: 'Contacted', qualified: 'Qualified', touring: 'Touring',
  negotiating: 'Negotiating', deal_closed: 'Deal Closed', deal_lost: 'Not Successful', cancelled: 'Cancelled',
}
const STATUS_BADGE: Record<string, string> = {
  new: 'badge-blue', contacted: 'badge-teal', qualified: 'badge-teal', touring: 'badge-teal',
  negotiating: 'badge-teal', deal_closed: 'badge-green', deal_lost: 'badge-gray', cancelled: 'badge-gray',
}

export default function BuyerLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    leadAPI.myLeads({ limit: 50 })
      .then(r => { if (r.data.success) setLeads(r.data.data.data || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md mb-1">My <span className="grad-text">Leads</span></h1>
        <p className="muted">{loading ? 'Loading…' : `${leads.length} propert${leads.length === 1 ? 'y' : 'ies'} you've enquired about`}</p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-24 rounded-2xl" />)}</div>
      ) : leads.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center card">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(49,178,222,0.08)', border: '1px solid rgba(49,178,222,0.20)' }}>
            <TrendingUp size={28} style={{ color: 'var(--teal)' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>No enquiries yet</h3>
          <p className="muted mb-7 max-w-xs">When you express interest in a property, it'll show up here so you can track its status.</p>
          <Link href="/buyer/properties" className="btn-primary"><Search size={15} /> Browse Properties</Link>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead, i) => (
            <motion.div key={lead._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={lead.property?.slug ? `/buyer/properties/${lead.property.slug}` : '#'} className="card p-4 flex items-center gap-4 hover:border-[rgba(49,178,222,0.35)] transition-colors">
                <div className="w-16 h-16 rounded-xl flex-shrink-0 relative overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                  {lead.property?.images?.[0]?.url ? (
                    <Image src={lead.property.images[0].url} alt="" fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Building2 size={20} style={{ color: 'var(--text-muted)', opacity: 0.4 }} /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{lead.property?.title || 'Property no longer listed'}</p>
                  <div className="flex items-center gap-3 text-xs mt-1 flex-wrap" style={{ color: 'var(--text-muted)' }}>
                    {lead.property?.location?.area && <span className="flex items-center gap-1"><MapPin size={10} />{lead.property.location.area}</span>}
                    {lead.property?.price && <span className="font-medium" style={{ color: 'var(--teal)' }}>{formatPrice(lead.property.price)}</span>}
                    <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(lead.createdAt)}</span>
                  </div>
                </div>
                <span className={cn('badge flex-shrink-0', STATUS_BADGE[lead.status] || 'badge-gray')}>{STATUS_LABELS[lead.status] || lead.status}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
