'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search, ShieldCheck, ShieldAlert, ChevronLeft, ChevronRight, X, Mail, Phone, CalendarDays, Home, TrendingUp,
  UserRound, Store, BadgeCheck, Loader2, Ban, CheckCircle2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import { IdTag } from '@/components/shared/UserIdChip'
import type { User } from '@/types'

type Customer = User & { listingsCount?: number; leadsCount?: number; signupVia?: string }
type Stats = { total: number; verified: number; unverified: number; newThisWeek: number; withoutListings?: number }

const VIA: Record<string, string> = { sms: 'SMS code', whatsapp: 'WhatsApp code', admin: 'Marked by admin' }
const SIGNUP: Record<string, string> = { email: 'Sign-up form', google: 'Google', facebook: 'Facebook', enquiry: 'From an enquiry' }
const VERIFY_TABS = [{ v: '', l: 'All' }, { v: 'no', l: 'Not verified' }, { v: 'yes', l: 'Verified' }]

// Buyers and Sellers admin pages (one component, two types): customer accounts only, with how each number was
// verified. Admins can open a customer for full details and mark a number verified (or un-verify it) by hand —
// new registrations and verifications also reach admins as notifications and by email.
export default function CustomersPage({ type }: { type: 'buyer' | 'seller' }) {
  const isSeller = type === 'seller'
  const [verified, setVerified] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<Customer | null>(null)
  const limit = 25

  const load = useCallback(() => {
    setLoading(true)
    adminAPI.getCustomers({ type, verified: verified || undefined, q: q || undefined, page, limit })
      .then(r => { const d = r.data.data; setRows(d.data || []); setTotal(d.total || 0); setStats(d.stats) })
      .catch(() => toast.error(`Failed to load ${type}s`))
      .finally(() => setLoading(false))
  }, [type, verified, q, page])
  useEffect(() => { const t = setTimeout(load, q ? 300 : 0); return () => clearTimeout(t) }, [load, q])

  const replace = (u: Customer) => { setRows(rs => rs.map(r => (r._id === u._id ? { ...r, ...u } : r))); setOpen(o => (o && o._id === u._id ? { ...o, ...u } : o)) }
  const totalPages = Math.ceil(total / limit)
  const Icon = isSeller ? Store : UserRound

  return (
    <div>
      <header className="flex items-center justify-between gap-3 flex-wrap px-5 sm:px-7 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}><Icon size={18} /> {isSeller ? 'Sellers' : 'Buyers'}</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {isSeller ? 'Everyone registered to sell — their number verification and how many listings they have.' : 'Everyone registered to buy or rent — their number verification and enquiries.'}
          </p>
        </div>
        <div className="input-glass w-full sm:w-72">
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input className="bg-transparent outline-none flex-1 text-sm min-w-0" placeholder="Search name, email, phone or ID…"
            value={q} onChange={e => { setQ(e.target.value); setPage(1) }} />
        </div>
      </header>

      <div className="p-5 sm:p-7 space-y-5">
        {/* Headline counts */}
        <div className={cn('grid gap-3 grid-cols-2', isSeller ? 'lg:grid-cols-5' : 'lg:grid-cols-4')}>
          <StatCard label={`Total ${type}s`} value={stats?.total} />
          <StatCard label="Number verified" value={stats?.verified} tone="green" onClick={() => { setVerified('yes'); setPage(1) }} />
          <StatCard label="Not verified" value={stats?.unverified} tone="amber" onClick={() => { setVerified('no'); setPage(1) }} />
          <StatCard label="New this week" value={stats?.newThisWeek} />
          {isSeller && <StatCard label="No listings yet" value={stats?.withoutListings} tone="amber" />}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {VERIFY_TABS.map(t => (
            <button key={t.v} onClick={() => { setVerified(t.v); setPage(1) }} className="btn-ghost btn-sm"
              style={verified === t.v ? { color: 'var(--teal)', borderColor: 'rgba(203,1,1,0.40)', background: 'rgba(203,1,1,0.06)' } : undefined}>
              {t.l}
            </button>
          ))}
          <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{total.toLocaleString()} {total === 1 ? type : `${type}s`}</span>
        </div>

        <div className="card overflow-x-auto">
          {loading ? (
            <div className="p-5 space-y-3">{Array(6).fill(null).map((_, i) => <div key={i} className="shimmer h-12 rounded-xl" />)}</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16">
              <Icon size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No {type}s match this filter</p>
            </div>
          ) : (
            <table className="tbl min-w-[760px]">
              <thead>
                <tr>
                  <th>Name</th><th>Contact</th><th>Number</th>
                  <th>{isSeller ? 'Listings' : 'Enquiries'}</th><th>Registered</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(u => (
                  <tr key={u._id} onClick={() => setOpen(u)} className="cursor-pointer">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'var(--grad)' }}>{u.name?.[0] || 'U'}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{u.name}<IdTag id={u.displayId} /></p>
                          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{SIGNUP[u.signupVia || 'email']}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-xs" style={{ color: 'var(--text)' }}>{u.email}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.phone || '—'}</p>
                    </td>
                    <td><VerifyBadge u={u} /></td>
                    <td className="text-sm font-semibold" style={{ color: (isSeller ? u.listingsCount : u.leadsCount) ? 'var(--text)' : 'var(--text-muted)' }}>
                      {isSeller ? u.listingsCount ?? 0 : u.leadsCount ?? 0}
                    </td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(u.createdAt)}</td>
                    <td><span className={cn('badge', u.status === 'suspended' ? 'badge-red' : u.status === 'active' ? 'badge-green' : 'badge-gray')}>{u.status.replace('_', ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost btn-sm p-2 disabled:opacity-40"><ChevronLeft size={14} /></button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-ghost btn-sm p-2 disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && <CustomerDrawer key={open._id} u={open} isSeller={isSeller} onClose={() => setOpen(null)} onChanged={u => { replace(u); load() }} />}
      </AnimatePresence>
    </div>
  )
}

function StatCard({ label, value, tone, onClick }: { label: string; value?: number; tone?: 'green' | 'amber'; onClick?: () => void }) {
  const color = tone === 'green' ? '#16A34A' : tone === 'amber' ? '#D97706' : 'var(--text)'
  return (
    <button onClick={onClick} disabled={!onClick} className="card p-4 text-left disabled:cursor-default">
      <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>{value === undefined ? '…' : value.toLocaleString()}</p>
    </button>
  )
}

function VerifyBadge({ u }: { u: Customer }) {
  if (!u.phone) return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No number</span>
  return u.isPhoneVerified ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: '#16A34A' }}>
      <ShieldCheck size={13} /> Verified{u.phoneVerifiedVia ? <span className="font-normal" style={{ color: 'var(--text-muted)' }}>· {VIA[u.phoneVerifiedVia]}</span> : null}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: '#D97706' }}><ShieldAlert size={13} /> Not verified</span>
  )
}

function CustomerDrawer({ u, isSeller, onClose, onChanged }: { u: Customer; isSeller: boolean; onClose: () => void; onChanged: (u: Customer) => void }) {
  const [phone, setPhone] = useState(u.phone || '')
  const [busy, setBusy] = useState(false)
  const by = typeof u.phoneVerifiedBy === 'object' ? u.phoneVerifiedBy?.name : undefined

  const setVerified = async (verified: boolean) => {
    if (!verified && !confirm(`Remove the verification from ${u.name}'s number? ${isSeller ? 'They will not be able to open their seller dashboard until they verify again.' : ''}`)) return
    setBusy(true)
    try {
      const r = await adminAPI.setPhoneVerification(u._id, verified, verified ? phone : undefined)
      toast.success(verified ? 'Number marked as verified' : 'Verification removed')
      onChanged({ ...u, ...r.data.data })
    } catch (err: any) { toast.error(err?.error || 'Could not update the verification') }
    finally { setBusy(false) }
  }

  const toggleSuspend = async () => {
    setBusy(true)
    try {
      const r = await adminAPI.suspendUser(u._id)
      toast.success(r.data.data.status === 'suspended' ? 'Account suspended' : 'Account reactivated')
      onChanged({ ...u, ...r.data.data })
    } catch (err: any) { toast.error(err?.error || 'Failed to update the account') }
    finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <motion.aside initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
        className="w-full max-w-md h-full overflow-y-auto" style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: 'var(--grad)' }}>{u.name?.[0]}</div>
            <div className="min-w-0">
              <p className="font-semibold truncate" style={{ color: 'var(--text)' }}>{u.name}<IdTag id={u.displayId} /></p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{isSeller ? 'Seller' : 'Buyer'} · {SIGNUP[u.signupVia || 'email']}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost btn-sm p-2"><X size={15} /></button>
        </div>

        <div className="p-5 space-y-5">
          <dl className="space-y-3 text-sm">
            <Detail icon={Mail} label="Email" value={<>{u.email} {u.isEmailVerified && <BadgeCheck size={13} className="inline ml-1" style={{ color: '#16A34A' }} />}</>} />
            <Detail icon={Phone} label="Phone" value={u.phone || '—'} />
            <Detail icon={CalendarDays} label="Registered" value={formatDate(u.createdAt)} />
            {isSeller
              ? <Detail icon={Home} label="Listings" value={<Link href="/admin/properties" className="underline">{u.listingsCount ?? 0}</Link>} />
              : <Detail icon={TrendingUp} label="Enquiries" value={<Link href="/admin/leads" className="underline">{u.leadsCount ?? 0}</Link>} />}
            <Detail icon={u.status === 'suspended' ? Ban : CheckCircle2} label="Account" value={u.status.replace('_', ' ')} />
          </dl>

          {/* Number verification */}
          <div className="rounded-2xl p-4" style={{ background: u.isPhoneVerified ? 'rgba(22,163,74,0.08)' : 'rgba(217,119,6,0.08)', border: `1px solid ${u.isPhoneVerified ? 'rgba(22,163,74,0.25)' : 'rgba(217,119,6,0.25)'}` }}>
            <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: u.isPhoneVerified ? '#16A34A' : '#D97706' }}>
              {u.isPhoneVerified ? <ShieldCheck size={15} /> : <ShieldAlert size={15} />} {u.isPhoneVerified ? 'Number verified' : 'Number not verified'}
            </p>
            {u.isPhoneVerified ? (
              <>
                <p className="text-xs mt-1" style={{ color: 'var(--text-mid)' }}>
                  {u.phoneVerifiedVia ? VIA[u.phoneVerifiedVia] : 'Verified'}{by ? ` (${by})` : ''}{u.phoneVerifiedAt ? ` · ${formatDate(u.phoneVerifiedAt)}` : ''}
                </p>
                <button onClick={() => setVerified(false)} disabled={busy} className="btn-ghost btn-sm mt-3 disabled:opacity-60">Remove verification</button>
              </>
            ) : (
              <>
                <p className="text-xs mt-1 mb-3" style={{ color: 'var(--text-mid)' }}>
                  {isSeller ? 'Until this number is verified the seller cannot open their dashboard or add listings. ' : ''}
                  If you have confirmed the number yourself (e.g. by phone), mark it verified.
                </p>
                <div className="flex gap-2">
                  <input className="input flex-1 min-w-0" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+971 50 123 4567" />
                  <button onClick={() => setVerified(true)} disabled={busy || !phone.trim()} className="btn-primary btn-sm whitespace-nowrap disabled:opacity-60">
                    {busy ? <Loader2 size={13} className="animate-spin" /> : 'Mark verified'}
                  </button>
                </div>
              </>
            )}
          </div>

          <button onClick={toggleSuspend} disabled={busy} className="btn-ghost btn-sm w-full justify-center disabled:opacity-60"
            style={{ color: u.status === 'suspended' ? 'var(--green)' : '#FB7185' }}>
            {u.status === 'suspended' ? <><CheckCircle2 size={13} /> Reactivate account</> : <><Ban size={13} /> Suspend account</>}
          </button>
        </div>
      </motion.aside>
    </div>
  )
}

function Detail({ icon: I, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <I size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
      <dt className="w-24 flex-shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>{label}</dt>
      <dd className="flex-1 min-w-0 break-words" style={{ color: 'var(--text)' }}>{value}</dd>
    </div>
  )
}
