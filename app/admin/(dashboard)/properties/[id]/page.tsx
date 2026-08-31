'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Pencil, CheckCircle2, XCircle, Handshake, RotateCcw, Trash2,
  MessageSquare, Send, Loader2, ExternalLink, Building2, MapPin,
  Eye, MessageCircleHeart, TrendingUp, Heart, CalendarClock, Share2,
} from 'lucide-react'
import { propertyAPI, agentAPI, chatAPI } from '@/lib/api'
import { formatPrice, formatDate, propertyStatusColor, cn, rentSuffix } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { PerformanceStats } from '@/components/admin/PerformanceStats'
import type { Property, Agent } from '@/types'
import toast from 'react-hot-toast'

const FEATURE_LABELS: Record<string, string> = {
  pool: 'Swimming Pool', gym: 'Gym', concierge: 'Concierge', security24h: '24h Security',
  smartHome: 'Smart Home', centralAC: 'Central A/C', builtInWardrobes: 'Built-in Wardrobes',
  coveredParking: 'Covered Parking', maidRoom: 'Maid Room', studyRoom: 'Study Room',
  jacuzzi: 'Jacuzzi', bbqArea: 'BBQ Area', petsAllowed: 'Pets Allowed', childrenPlay: "Children's Play",
  viewSea: 'Sea View', viewGolf: 'Golf View', viewBurjKhalifa: 'Burj Khalifa View',
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm" style={{ color: 'var(--text)' }}>{value ?? '—'}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text)' }}>{title}</h2>
      {children}
    </div>
  )
}

function ActionButton({ onClick, icon: Icon, label, tone, disabled, title, href, target }: {
  onClick?: () => void; icon: any; label: string; tone: 'teal' | 'green' | 'red' | 'gold' | 'muted'
  disabled?: boolean; title?: string; href?: string; target?: string
}) {
  const colors: Record<string, string> = {
    teal: 'var(--teal)', green: 'var(--green)', red: '#FB7185', gold: 'var(--gold, #D4A24C)', muted: 'var(--text-muted)',
  }
  const cls = 'btn-ghost btn-sm gap-2 justify-start w-full'
  const style = { color: colors[tone], opacity: disabled ? 0.4 : 1 }
  if (href) {
    return (
      <Link href={href} target={target} className={cls} style={style} title={title}>
        <Icon size={14} /> {label}
      </Link>
    )
  }
  return (
    <button onClick={onClick} disabled={disabled} className={cls} style={style} title={title}>
      <Icon size={14} /> {label}
    </button>
  )
}

export default function AdminPropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const isFullAccess = user?.role === 'admin' || user?.role === 'super_admin'

  const [property, setProperty] = useState<Property | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [messaging, setMessaging] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    propertyAPI.getOne(id)
      .then(r => { if (r.data.success) setProperty(r.data.data) })
      .catch(() => toast.error('Failed to load listing'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => { agentAPI.getAll().then(r => { if (r.data.success) setAgents(r.data.data) }).catch(() => {}) }, [])

  useEffect(() => {
    if (!id) return
    setAnalyticsLoading(true)
    propertyAPI.getAnalytics(id)
      .then(r => { if (r.data.success) setAnalytics(r.data.data) })
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false))
  }, [id])

  const assignAgent = async (agentUserId: string) => {
    if (!agentUserId || !property) return
    try {
      await propertyAPI.assignAgent(property._id, agentUserId)
      toast.success('Agent assigned')
      load()
    } catch (err: any) { toast.error(err?.error || 'Failed to assign agent') }
  }

  const approve = async () => {
    if (!property) return
    try {
      await propertyAPI.approve(property._id)
      toast.success('Listing approved')
      load()
    } catch (err: any) { toast.error(err?.error || 'Failed to approve') }
  }

  const reject = async () => {
    if (!property) return
    try {
      await propertyAPI.reject(property._id, rejectReason || 'Does not meet listing guidelines')
      toast.success('Listing rejected')
      setRejecting(false); setRejectReason('')
      load()
    } catch (err: any) { toast.error(err?.error || 'Failed to reject') }
  }

  const reopen = async () => {
    if (!property) return
    try {
      await propertyAPI.reopen(property._id)
      toast.success('Listing reopened — back on the marketplace')
      load()
    } catch (err: any) { toast.error(err?.error || 'Failed to reopen') }
  }

  const closeDeal = async () => {
    if (!property) return
    if (!confirm(`Mark "${property.title}" as sold and remove it from the marketplace? You can undo this afterward if it was a mistake.`)) return
    try {
      await propertyAPI.closeDeal(property._id)
      load()
      toast((t: any) => (
        <div className="flex items-center gap-3">
          <span className="text-sm">Marked "{property.title}" as sold</span>
          <button onClick={() => { toast.dismiss(t.id); reopen() }} className="text-sm font-semibold underline flex-shrink-0" style={{ color: 'var(--teal)' }}>
            Undo
          </button>
        </div>
      ), { duration: 8000 })
    } catch (err: any) { toast.error(err?.error || 'Failed to close deal') }
  }

  const goToChat = async () => {
    if (!property) return
    try {
      const room = await chatAPI.createRoom({ type: 'seller_agent', participantId: property.seller?._id, property: property._id })
      router.push(`/admin/messages?room=${room.data.data._id}`)
    } catch {
      toast.error('Failed to open conversation')
    }
  }

  const sendQuickMessage = async () => {
    if (!property || !messageText.trim()) return
    setSendingMessage(true)
    try {
      const room = await chatAPI.createRoom({ type: 'seller_agent', participantId: property.seller?._id, property: property._id })
      await chatAPI.sendMessage(room.data.data._id, messageText.trim())
      toast.success('Message sent to seller')
      setMessageText('')
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const canDelete = property && (isFullAccess || property.agent?._id === user?._id || (user?.permissions || []).includes('manage_agents'))

  const removeProperty = async () => {
    if (!property) return
    if (!confirm(`Remove "${property.title}" from the marketplace? This also deletes the seller/agent chat for this listing and cannot be undone.`)) return
    try {
      await propertyAPI.delete(property._id)
      toast.success('Listing removed')
      router.push('/admin/properties')
    } catch (err: any) { toast.error(err?.error || 'Failed to delete') }
  }

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

  const canApprove = ['pending', 'under_review'].includes(property.status)
  const canReject = ['pending', 'under_review', 'published'].includes(property.status)

  return (
    <div>
      <header className="flex items-center justify-between px-7 py-4 flex-shrink-0 flex-wrap gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => router.back()} className="btn-ghost btn-sm gap-2">
          <ArrowLeft size={14} /> Back
        </button>
        <Link href={`/buyer/properties/${property.slug || property._id}`} target="_blank" className="btn-ghost btn-sm gap-2">
          <ExternalLink size={13} /> View on Marketplace
        </Link>
      </header>

      <div className="p-7 max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-5">
          <Section title="Overview">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{property.title}</h1>
                  {property.referenceId && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-alt)', color: 'var(--text-muted)' }}>
                      {property.referenceId}
                    </span>
                  )}
                  <span className={cn('badge', propertyStatusColor(property.status))}>{property.status.replace('_', ' ')}</span>
                  {['pending', 'under_review'].includes(property.status) && (
                    <span className={cn('badge text-[10px]', property.detailsCompleted ? 'badge-green' : 'badge-gray')}>
                      {property.detailsCompleted ? 'Ready' : 'Incomplete'}
                    </span>
                  )}
                </div>
                <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <MapPin size={13} /> {property.location?.area ? `${property.location.area}, ` : ''}{property.location?.city} · {property.type}
                </p>
              </div>
              <p className="text-2xl font-bold grad-text">{formatPrice(property.price)}{rentSuffix(property)}</p>
            </div>
            <div className="text-sm leading-relaxed rich-content" style={{ color: 'var(--text-mid)' }}
              dangerouslySetInnerHTML={{ __html: property.description }} />
          </Section>

          <Section title="Performance">
            <PerformanceStats
              loading={analyticsLoading}
              stats={[
                { label: 'Views',         value: analytics?.stats?.views || 0,           icon: Eye },
                { label: 'Interested',    value: analytics?.stats?.interestedCount || 0, icon: MessageCircleHeart },
                { label: 'Leads',         value: analytics?.stats?.leads || 0,           icon: TrendingUp },
                { label: 'Favorites',     value: analytics?.stats?.favorites || 0,       icon: Heart },
                { label: 'Tour Requests', value: analytics?.stats?.tourRequests || 0,    icon: CalendarClock },
                { label: 'Shares',        value: analytics?.stats?.shares || 0,          icon: Share2 },
                { label: 'Reopened',      value: analytics?.stats?.reopenCount || 0,     icon: RotateCcw },
              ]}
              conversionRate={analytics?.conversionRate}
              topCountries={analytics?.topCountries}
            />
          </Section>

          <Section title="Basic Details">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Category" value={<span className="capitalize">{property.category || '—'}</span>} />
              <Field label="Property Type" value={<span className="capitalize">{property.type?.replace('_', ' ')}</span>} />
              <Field label="Listing" value={property.listingType === 'rent' ? `For Rent${property.rentFrequency ? ` (${property.rentFrequency})` : ''}` : 'For Sale'} />
              <Field label="Furnishing" value={<span className="capitalize">{property.furnishing?.replace('_', ' ')}</span>} />
              <Field label="Completion" value={<span className="capitalize">{property.completion?.replace('_', ' ')}</span>} />
              <Field label="Urgency (staff only)" value={<span className="capitalize">{property.urgency?.replace(/_/g, ' ') || '—'}</span>} />
              <Field label="Developer" value={property.developer} />
              <Field label="Project Name" value={property.projectName} />
            </div>
          </Section>

          <Section title="Area * (public) / City (public)">
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              These are the only location fields buyers ever see — everything below is staff-only.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Area *" value={property.location?.area} />
              <Field label="City" value={property.location?.city} />
            </div>
          </Section>

          <Section title="Location (staff only)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Street / Landmark</p><p style={{ color: 'var(--text)' }}>{property.location?.address || '—'}</p></div>
              <div><p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>District</p><p style={{ color: 'var(--text)' }}>{property.location?.district || '—'}</p></div>
              <div className="sm:col-span-2"><p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Additional Address</p><p style={{ color: 'var(--text)' }}>{property.location?.additionalAddress || '—'}</p></div>
            </div>
          </Section>

          <Section title="Amenities">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Bedrooms" value={property.amenities?.bedrooms} />
              <Field label="Bathrooms" value={property.amenities?.bathrooms} />
              <Field label="Parking Spaces" value={property.amenities?.parkingSpaces} />
              <Field label="Balconies" value={property.amenities?.balconies} />
              <Field label="Floor Area" value={property.amenities?.floorArea ? `${property.amenities.floorArea} sqft` : undefined} />
              <Field label="Plot Area" value={(property.amenities as any)?.plotArea ? `${(property.amenities as any).plotArea} sqft` : undefined} />
              <Field label="Floor #" value={(property.amenities as any)?.floor} />
              <Field label="Total Floors" value={(property.amenities as any)?.totalFloors} />
              <Field label="Year Built" value={(property.amenities as any)?.yearBuilt} />
            </div>
          </Section>

          <Section title="Features">
            {property.features && Object.values(property.features).some(Boolean) ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.entries(property.features).filter(([, v]) => v).map(([key]) => (
                  <span key={key} className="badge badge-teal text-xs justify-start px-3 py-2">
                    {FEATURE_LABELS[key] || key}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No features set yet.</p>
            )}
          </Section>

          {property.images?.length > 0 && (
            <Section title="Photos">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {property.images.map((img, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {property.status === 'rejected' && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.18)', color: '#FB7185' }}>
              <strong>Rejection reason:</strong> {(property as any).rejectionReason || 'Not specified'}
            </div>
          )}
        </div>

        {/* Right: people + actions */}
        <div className="space-y-5">
          <Section title="Seller">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: 'var(--grad)' }}>
                {property.seller?.name?.[0] || 'S'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{property.seller?.name || '—'}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{property.seller?.email}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{(property.seller as any)?.phone}</p>
              </div>
            </div>
          </Section>

          <Section title="Assigned Agent">
            <select
              className="select-field w-full text-sm"
              value={property.agent?._id || ''}
              onChange={e => assignAgent(e.target.value)}
            >
              <option value="">Unassigned</option>
              {agents.map(a => (
                <option key={a._id} value={a.user._id}>{a.user.name}</option>
              ))}
            </select>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Submitted {formatDate(property.createdAt)}</p>
          </Section>

          <Section title="Actions">
            <div className="space-y-1">
              <ActionButton href={`/admin/properties/${property._id}/edit`} icon={Pencil} tone="teal" label={property.detailsCompleted ? 'Edit Listing' : 'Complete Listing Details'} />
              {canApprove && (
                <ActionButton
                  onClick={() => property.detailsCompleted ? approve() : toast.error('Complete the listing details before approving')}
                  icon={CheckCircle2} tone="green" disabled={!property.detailsCompleted}
                  label="Approve" title={property.detailsCompleted ? undefined : 'Complete listing details first'}
                />
              )}
              {canReject && (
                <ActionButton onClick={() => setRejecting(r => !r)} icon={XCircle} tone="red"
                  label={property.status === 'published' ? 'Unapprove' : 'Reject'} />
              )}
              {rejecting && (
                <div className="flex items-center gap-2 pt-1 pb-1">
                  <input
                    className="input py-1.5 text-xs flex-1"
                    placeholder={property.status === 'published' ? 'Reason for sending back for revision…' : 'Reason for rejection…'}
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                  />
                  <button onClick={reject} className="btn-primary btn-sm flex-shrink-0">Confirm</button>
                </div>
              )}
              {property.status === 'published' && (
                <ActionButton onClick={closeDeal} icon={Handshake} tone="gold" label="Close Deal (Mark Sold)" />
              )}
              {property.status === 'sold' && (
                <ActionButton onClick={reopen} icon={RotateCcw} tone="green" label="Reopen Listing" />
              )}
              <ActionButton onClick={() => setMessaging(m => !m)} icon={MessageSquare} tone="teal" label="Message Seller" />
              {messaging && (
                <div className="space-y-2 pt-1 pb-1">
                  <div className="flex items-center gap-2">
                    <input
                      className="input py-1.5 text-xs flex-1"
                      placeholder={`Message ${property.seller?.name || 'seller'}…`}
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') sendQuickMessage() }}
                    />
                    <button onClick={sendQuickMessage} disabled={sendingMessage} className="btn-primary btn-sm gap-1.5 flex-shrink-0">
                      {sendingMessage ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      Send
                    </button>
                  </div>
                  <button onClick={goToChat} className="btn-ghost btn-sm gap-1.5 w-full justify-start" style={{ color: 'var(--text-muted)' }}>
                    <ExternalLink size={12} /> Go to full chat
                  </button>
                </div>
              )}
              {canDelete && (
                <ActionButton onClick={removeProperty} icon={Trash2} tone="red" label="Remove from Marketplace" title="Deletes the listing and its chat" />
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
