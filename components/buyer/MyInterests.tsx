'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Building2, Calendar, HardHat, MapPin, Search, User } from 'lucide-react'
import { leadAPI } from '@/lib/api'
import { formatPrice, formatDateTime, rentSuffix, cn } from '@/lib/utils'
import type { Lead } from '@/types'

// Plain-language progress for the person who asked — not the internal pipeline names.
const STATUS_LABELS: Record<string, string> = {
  new: 'Received', contacted: 'Agent in touch', qualified: 'In progress', touring: 'Viewing',
  negotiating: 'Negotiating', deal_closed: 'Deal closed', deal_lost: 'Closed', cancelled: 'Cancelled',
}
const STATUS_BADGE: Record<string, string> = {
  new: 'badge-blue', contacted: 'badge-teal', qualified: 'badge-teal', touring: 'badge-teal',
  negotiating: 'badge-teal', deal_closed: 'badge-green', deal_lost: 'badge-gray', cancelled: 'badge-gray',
}

// Every property and project this person has said "I'm interested" in, with where each one stands.
// Used on the buyer profile and the seller profile (a seller can be a buyer too).
export default function MyInterests({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<Lead[] | null>(null)

  useEffect(() => {
    leadAPI.myInterests()
      .then(r => setItems(r.data.success ? r.data.data : []))
      .catch(() => setItems([]))
  }, [])

  if (items === null) {
    return <div className="space-y-3">{Array(3).fill(null).map((_, i) => <div key={i} className="shimmer h-20 rounded-2xl" />)}</div>
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-10 px-4 rounded-2xl" style={{ background: 'var(--bg-alt)', border: '1px dashed var(--border)' }}>
        <Building2 size={26} className="mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Nothing here yet</p>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Tap “Interested” on a property or project and it will be listed here, with its progress.</p>
        <Link href="/buyer/properties" className="btn-primary btn-sm"><Search size={13} /> Browse properties</Link>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', compact && 'space-y-2')}>
      {items.map(lead => {
        const isProject = lead.leadType === 'project' && lead.project
        const p: any = lead.property
        const pr: any = lead.project
        const href = isProject ? `/projects/${pr.slug}` : p?.slug ? `/buyer/properties/${p.slug}` : '#'
        const image = isProject ? pr.coverImage : p?.images?.[0]?.url
        const title = isProject ? pr.title : p?.title || 'Property no longer listed'
        const area = isProject ? pr.area : p?.location?.area
        return (
          <Link key={lead._id} href={href} className="card p-3.5 flex items-center gap-4 transition-colors hover:border-[rgba(203,1,1,0.35)]">
            <div className="w-16 h-16 rounded-xl flex-shrink-0 relative overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
              {image ? <Image src={image} alt="" fill className="object-cover" sizes="64px" /> : (
                <div className="w-full h-full flex items-center justify-center"><Building2 size={20} style={{ color: 'var(--text-muted)', opacity: 0.4 }} /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isProject && <span className="badge badge-purple text-[10px] flex items-center gap-1 flex-shrink-0"><HardHat size={9} /> Project</span>}
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{title}</p>
              </div>
              <div className="flex items-center gap-3 text-xs mt-1 flex-wrap" style={{ color: 'var(--text-muted)' }}>
                {area && <span className="flex items-center gap-1"><MapPin size={10} />{area}</span>}
                {isProject
                  ? pr.priceFrom ? <span className="font-medium" style={{ color: 'var(--teal)' }}>From {formatPrice(pr.priceFrom)}</span> : null
                  : p?.price ? <span className="font-medium" style={{ color: 'var(--teal)' }}>{formatPrice(p.price)}{rentSuffix(p)}</span> : null}
                <span className="flex items-center gap-1"><Calendar size={10} />{formatDateTime(lead.createdAt)}</span>
                {lead.assignedAgent?.name && <span className="flex items-center gap-1"><User size={10} />{lead.assignedAgent.name}</span>}
              </div>
            </div>
            <span className={cn('badge flex-shrink-0', STATUS_BADGE[lead.status] || 'badge-gray')}>{STATUS_LABELS[lead.status] || lead.status}</span>
          </Link>
        )
      })}
    </div>
  )
}
