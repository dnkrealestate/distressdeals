'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Pencil, Eye, TrendingUp, Heart, Building2, MapPin, BarChart3, Clock, MessageSquare, Loader2 } from 'lucide-react'
import { propertyAPI, leadAPI, chatAPI } from '@/lib/api'
import { formatPrice, formatDate, propertyStatusColor, cn, rentSuffix } from '@/lib/utils'
import type { Property, Lead } from '@/types'
import toast from 'react-hot-toast'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [analytics, setAnalytics] = useState<{ conversionRate: number } | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [messaging, setMessaging] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      propertyAPI.getOne(id),
      propertyAPI.getAnalytics(id),
      leadAPI.myLeads({ limit: 100 }),
    ]).then(([p, a, l]) => {
      if (p.data.success) setProperty(p.data.data)
      if (a.data.success) setAnalytics(a.data.data)
      if (l.data.success) setLeads((l.data.data.data || []).filter((ld: Lead) => (ld.property as any)?._id === id))
    }).catch(() => toast.error('Failed to load listing')).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="p-7 space-y-4">{Array(3).fill(null).map((_, i) => <div key={i} className="shimmer h-24 rounded-2xl" />)}</div>
  }

  if (!property) {
    return (
      <div className="p-7 text-center py-24">
        <Building2 size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Listing not found</p>
      </div>
    )
  }

  const messageAgent = async () => {
    if (!property?.agent) return
    setMessaging(true)
    try {
      const res = await chatAPI.createRoom({ type: 'seller_agent', participantId: property.agent._id, property: property._id })
      router.push(`/seller/messages?room=${res.data.data._id}`)
    } catch {
      toast.error('Failed to open conversation')
    } finally {
      setMessaging(false)
    }
  }

  const STATS = [
    { label: 'Views',       val: property.stats?.views || 0,      Icon: Eye,       accent: 'var(--teal)'  },
    { label: 'Leads',       val: property.stats?.leads || 0,      Icon: TrendingUp,accent: '#A855F7'      },
    { label: 'Favorites',   val: property.stats?.favorites || 0,  Icon: Heart,     accent: '#FB7185'      },
    { label: 'Conversion',  val: `${analytics?.conversionRate ?? 0}%`, Icon: BarChart3, accent: 'var(--green)' },
  ]

  return (
    <div>
      <header className="flex items-center justify-between px-7 py-4 flex-shrink-0 flex-wrap gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => router.back()} className="btn-ghost btn-sm gap-2">
          <ArrowLeft size={14} /> Back
        </button>
        <Link href={`/seller/listings/${id}/edit`} className="btn-primary btn-sm gap-2">
          <Pencil size={13} /> Edit Listing
        </Link>
      </header>

      <div className="p-7 max-w-4xl">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{property.title}</h1>
              <span className={cn('badge', propertyStatusColor(property.status))}>{property.status.replace('_', ' ')}</span>
            </div>
            <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <MapPin size={13} /> {property.location?.address}, {property.location?.area}
            </p>
          </div>
          <p className="text-2xl font-bold grad-text">{formatPrice(property.price)}{rentSuffix(property)}</p>
        </div>

        {property.status === 'rejected' && (
          <div className="mt-4 p-4 rounded-xl flex items-center justify-between gap-4 flex-wrap text-sm" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.18)', color: '#FB7185' }}>
            <span><strong>Rejection reason:</strong> {(property as any).rejectionReason || 'This listing was not approved.'}</span>
            <Link href={`/seller/listings/${id}/edit`} className="btn-ghost btn-sm flex-shrink-0" style={{ color: '#FB7185' }}>
              Fix &amp; Resubmit
            </Link>
          </div>
        )}

        {(property.status === 'pending' || property.status === 'under_review') && (
          <div className="mt-4 p-4 rounded-xl flex items-center justify-between gap-4 flex-wrap" style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.18)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(20,184,166,0.12)', color: 'var(--teal)' }}>
                <Clock size={16} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Under review — approval in progress</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {property.agent
                    ? <>Assigned to <strong style={{ color: 'var(--text-mid)' }}>{property.agent.name}</strong> — they'll contact you to complete the listing before it goes live.</>
                    : 'We\'re assigning an agent to your listing shortly.'}
                </p>
              </div>
            </div>
            {property.agent && (
              <button onClick={messageAgent} disabled={messaging} className="btn-primary btn-sm gap-2 flex-shrink-0">
                {messaging ? <Loader2 size={13} className="animate-spin" /> : <MessageSquare size={13} />}
                Message Agent
              </button>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="stat-card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.accent}1A`, border: `1px solid ${s.accent}33`, color: s.accent }}>
                <s.Icon size={16} />
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{s.val}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Images */}
        {property.images?.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
            {property.images.map((img, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        <div className="card p-6 mb-6">
          <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>Description</h2>
          <div className="text-sm leading-relaxed rich-content" style={{ color: 'var(--text-mid)' }}
            dangerouslySetInnerHTML={{ __html: property.description }} />
        </div>

        {/* Details */}
        <div className="card p-6 mb-6">
          <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text)' }}>Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p style={{ color: 'var(--text-muted)' }} className="text-xs mb-1">Bedrooms</p><p style={{ color: 'var(--text)' }}>{property.amenities?.bedrooms ?? '—'}</p></div>
            <div><p style={{ color: 'var(--text-muted)' }} className="text-xs mb-1">Bathrooms</p><p style={{ color: 'var(--text)' }}>{property.amenities?.bathrooms ?? '—'}</p></div>
            <div><p style={{ color: 'var(--text-muted)' }} className="text-xs mb-1">Floor Area</p><p style={{ color: 'var(--text)' }}>{property.amenities?.floorArea ?? '—'} sqft</p></div>
            <div><p style={{ color: 'var(--text-muted)' }} className="text-xs mb-1">Furnishing</p><p style={{ color: 'var(--text)' }} className="capitalize">{property.furnishing?.replace('_', ' ')}</p></div>
          </div>
        </div>

        {/* Leads on this property */}
        <div className="card p-6">
          <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text)' }}>Leads on this Listing</h2>
          {leads.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No leads yet for this property.</p>
          ) : (
            <div className="space-y-2">
              {leads.map(lead => (
                <div key={lead._id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-alt)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: 'var(--grad)' }}>
                    {lead.buyer?.name?.[0] || 'B'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{lead.buyer?.name || 'Interested Buyer'}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(lead.createdAt)}</p>
                  </div>
                  <span className="badge badge-teal text-xs">{lead.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
