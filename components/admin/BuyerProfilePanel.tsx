'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Heart, GitCompare, HardHat, Target, UserCheck, Sparkles, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import { userAPI } from '@/lib/api'
import { formatPrice, formatDate, rentSuffix } from '@/lib/utils'

// Everything one buyer cares about, in one place, for the agent who handles them: who they are, what they're
// interested in (across ALL properties/projects, not just this lead), what they liked, what they're comparing, and a
// summary of what they seem to want.
const LABEL: Record<string, string> = {
  new: 'Received', contacted: 'Contacted', qualified: 'Qualified', touring: 'Viewing',
  negotiating: 'Negotiating', deal_closed: 'Closed', deal_lost: 'Lost', cancelled: 'Cancelled',
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(203,1,1,0.08)', color: 'var(--teal)' }}>{children}</span>
}

function PropRow({ p, extra }: { p: any; extra?: React.ReactNode }) {
  return (
    <Link href={p?.slug ? `/buyer/properties/${p.slug}` : '#'} target="_blank" className="flex items-center gap-2.5 p-2 rounded-xl transition-colors hover:bg-[var(--bg-alt)]">
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-alt)' }}>
        {p?.images?.[0]?.url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
          : <Building2 size={14} style={{ color: 'var(--text-muted)' }} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{p?.title || 'Property no longer listed'}</p>
        <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
          {[p?.location?.area, p?.type, p?.amenities?.bedrooms !== undefined ? (p.amenities.bedrooms ? `${p.amenities.bedrooms} BR` : 'Studio') : ''].filter(Boolean).join(' · ')}
          {p?.price ? ` · ${formatPrice(p.price)}${rentSuffix(p)}` : ''}
        </p>
      </div>
      {extra}
    </Link>
  )
}

function Section({ icon: Icon, title, count, children }: { icon: any; title: string; count?: number; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
        <Icon size={12} style={{ color: 'var(--teal)' }} /> {title}{count !== undefined && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> · {count}</span>}
      </p>
      {children}
    </div>
  )
}

export default function BuyerProfilePanel({ buyerId, agents, isAdmin }: { buyerId: string; agents: { _id: string; name: string }[]; isAdmin: boolean }) {
  const [data, setData] = useState<any>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading')
  const [assigning, setAssigning] = useState(false)

  const load = useCallback(() => {
    userAPI.getBuyerProfile(buyerId)
      .then(r => { setData(r.data.data); setState('ok') })
      .catch(() => setState('denied'))
  }, [buyerId])
  useEffect(() => { load() }, [load])

  if (state === 'loading') return <div className="shimmer h-24 rounded-xl" />
  if (state === 'denied' || !data) return null

  const { buyer, interests, favorites, compare, needs } = data
  const wants = needs?.wants
  const assign = async (agentId: string) => {
    if (!agentId) return
    setAssigning(true)
    try {
      const res = await userAPI.assignBuyerAgent(buyerId, agentId)
      toast.success(`Buyer assigned — ${res.data.data?.moved ?? 0} open interests moved`)
      load()
    } catch (err: any) {
      toast.error(err?.error || 'Could not assign')
    } finally { setAssigning(false) }
  }

  return (
    <div className="rounded-2xl p-4 space-y-4" style={{ border: '1px solid rgba(203,1,1,0.22)', background: 'rgba(203,1,1,0.03)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
            <UserCheck size={14} style={{ color: 'var(--teal)' }} /> Buyer profile
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-mid)' }}>{buyer.name} · {buyer.phone || 'no phone'}{buyer.email ? ` · ${buyer.email}` : ''}</p>
          <p className="text-[11px] mt-0.5 flex items-center gap-1 flex-wrap" style={{ color: 'var(--text-muted)' }}>
            {buyer.isPhoneVerified
              ? <span className="inline-flex items-center gap-1" style={{ color: '#16A34A' }}><ShieldCheck size={11} /> WhatsApp verified</span>
              : <span className="inline-flex items-center gap-1"><ShieldAlert size={11} /> Number not verified</span>}
            {buyer.autoCreated && <span>· Account created automatically from an enquiry</span>}
            <span>· Member since {formatDate(buyer.createdAt)}</span>
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Agent: <strong style={{ color: 'var(--text-mid)' }}>{buyer.assignedAgent?.name || 'not assigned yet'}</strong></p>
        </div>
        {isAdmin && agents.length > 0 && (
          <div className="flex-shrink-0 flex items-center gap-1.5">
            {assigning && <Loader2 size={12} className="animate-spin" />}
            <select className="select-field text-[11px] py-1" value="" onChange={e => assign(e.target.value)} aria-label="Assign this buyer to an agent">
              <option value="">Assign buyer…</option>
              {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {needs?.signalCount > 0 ? (
        <Section icon={Sparkles} title="What they seem to want">
          <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-mid)' }}>
            {wants?.purpose?.length > 0 && <p>Looking to <strong>{wants.purpose.map((x: any) => (x.value === 'rent' ? 'rent' : 'buy')).join(' / ')}</strong></p>}
            {wants?.types?.length > 0 && <div className="flex flex-wrap gap-1 items-center"><span style={{ color: 'var(--text-muted)' }}>Types</span>{wants.types.map((x: any) => <Chip key={x.value}>{x.value.replace(/_/g, ' ')}</Chip>)}</div>}
            {wants?.areas?.length > 0 && <div className="flex flex-wrap gap-1 items-center"><span style={{ color: 'var(--text-muted)' }}>Areas</span>{wants.areas.map((x: any) => <Chip key={x.value}>{x.value}</Chip>)}</div>}
            {wants?.bedrooms?.length > 0 && <div className="flex flex-wrap gap-1 items-center"><span style={{ color: 'var(--text-muted)' }}>Bedrooms</span>{wants.bedrooms.map((x: any) => <Chip key={x.value}>{x.value === '0' ? 'Studio' : `${x.value} BR`}</Chip>)}</div>}
            {needs.price?.sale && <p>Buying budget seen: <strong>{formatPrice(needs.price.sale.min)} – {formatPrice(needs.price.sale.max)}</strong></p>}
            {needs.price?.rent && <p>Rent range seen: <strong>{formatPrice(needs.price.rent.min)} – {formatPrice(needs.price.rent.max)}</strong> / yr</p>}
            {needs.statedBudget && <p>Stated budget up to <strong>{formatPrice(needs.statedBudget.max)}</strong></p>}
            {needs.requirements?.map((r: string, i: number) => <p key={i} className="italic" style={{ color: 'var(--text-muted)' }}>“{r}”</p>)}
          </div>
        </Section>
      ) : <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{needs?.message}</p>}

      <Section icon={Target} title="Interested in" count={interests.length}>
        <div className="space-y-0.5">
          {interests.length === 0 && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nothing yet</p>}
          {interests.map((l: any) => l.leadType === 'project' && l.project ? (
            <Link key={l._id} href={`/projects/${l.project.slug}`} target="_blank" className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[var(--bg-alt)]">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-alt)' }}><HardHat size={14} style={{ color: 'var(--text-muted)' }} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{l.project.title}</p>
                <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>Off-plan · {l.project.developer}{l.project.priceFrom ? ` · from ${formatPrice(l.project.priceFrom)}` : ''}</p>
              </div>
              <Chip>{LABEL[l.status] || l.status}</Chip>
            </Link>
          ) : <PropRow key={l._id} p={l.property} extra={<Chip>{LABEL[l.status] || l.status}</Chip>} />)}
        </div>
      </Section>

      <Section icon={Heart} title="Liked" count={favorites.length}>
        <div className="space-y-0.5">{favorites.length === 0 ? <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nothing liked yet</p> : favorites.map((p: any) => <PropRow key={p._id} p={p} />)}</div>
      </Section>

      <Section icon={GitCompare} title="Comparing" count={compare.length}>
        <div className="space-y-0.5">{compare.length === 0 ? <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Not comparing anything</p> : compare.map((p: any) => <PropRow key={p._id} p={p} />)}</div>
      </Section>
    </div>
  )
}
