'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Clock, Home, TrendingUp, UserPlus, CheckCircle2,
  DollarSign, Users, ShieldCheck, ChevronRight, AlertCircle, Megaphone,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { adminAPI, propertyAPI, leadAPI } from '@/lib/api'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import type { Property, Lead, LeadSourceReport } from '@/types'

interface DashboardStats {
  totalProperties: number; pendingApprovals: number; activeListings: number
  totalLeads: number; newLeadsToday: number
  totalDeals: number; dealsThisMonth: number
  totalRevenue: number; revenueThisMonth: number
  totalUsers: number; newUsersToday: number
  activeAgents: number
}

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pending, setPending] = useState<Property[]>([])
  const [recentLeads, setRecentLeads] = useState<Lead[]>([])
  const [sources, setSources] = useState<LeadSourceReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminAPI.getDashboard(),
      propertyAPI.manageAll({ status: 'pending', limit: 5 }),
      leadAPI.getAll({ limit: 5 }),
      leadAPI.sourceReport(),
    ]).then(([d, p, l, s]) => {
      if (d.data.success) setStats(d.data.data)
      if (p.data.success) setPending(p.data.data.data || [])
      if (l.data.success) setRecentLeads(l.data.data.data || [])
      if (s.data.success) setSources(s.data.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const STATS = [
    { label: 'Pending Approvals', val: stats?.pendingApprovals ?? 0, Icon: Clock,        accent: '#60A5FA' },
    { label: 'Active Listings',   val: stats?.activeListings   ?? 0, Icon: Home,         accent: 'var(--teal)' },
    { label: 'Total Leads',       val: stats?.totalLeads       ?? 0, Icon: TrendingUp,   accent: '#A855F7' },
    { label: 'New Leads Today',   val: stats?.newLeadsToday    ?? 0, Icon: UserPlus,     accent: 'var(--green)' },
    { label: 'Deals This Month',  val: stats?.dealsThisMonth   ?? 0, Icon: CheckCircle2, accent: 'var(--green)' },
    { label: 'Revenue This Month',val: stats ? formatPrice(stats.revenueThisMonth) : '—', Icon: DollarSign, accent: '#F59E0B' },
    { label: 'Total Users',       val: stats?.totalUsers       ?? 0, Icon: Users,        accent: '#60A5FA' },
    { label: 'Active Agents',     val: stats?.activeAgents     ?? 0, Icon: ShieldCheck,  accent: 'var(--teal)' },
  ]

  return (
    <div>
      {/* Top bar */}
      <header className="flex items-center justify-between px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Centralized Control</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Welcome back, {user?.name?.split(' ')[0]} · {new Date().toLocaleDateString('en-AE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </header>

      <div className="p-7">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${s.accent}1A`, border: `1px solid ${s.accent}33`, color: s.accent }}
              >
                <s.Icon size={16} />
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                {loading ? <span className="shimmer inline-block w-12 h-6 rounded" /> : s.val.toLocaleString?.() ?? s.val}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Pending approvals */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Pending Approvals</h2>
                <Link href="/admin/properties?status=pending" className="text-xs flex items-center gap-1 font-medium" style={{ color: 'var(--teal)' }}>
                  View all <ChevronRight size={12} />
                </Link>
              </div>
              {loading ? (
                <div className="space-y-3">{Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-14 rounded-xl" />)}</div>
              ) : pending.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No listings waiting for review</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pending.map((p, i) => (
                    <motion.div key={p._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <Link href={`/admin/properties?status=pending`}>
                        <div className="flex items-center gap-3 p-3 rounded-xl transition-colors" style={{ background: 'var(--bg-alt)' }}>
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                            <Home size={18} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{p.title}</p>
                            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.location?.area} · {formatPrice(p.price)} · {p.seller?.name}</p>
                          </div>
                          <span className="badge badge-blue text-xs flex-shrink-0">{p.status}</span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent leads */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Recent Leads</h2>
                <Link href="/admin/leads" className="text-xs flex items-center gap-1 font-medium" style={{ color: 'var(--teal)' }}>
                  View all <ChevronRight size={12} />
                </Link>
              </div>
              {loading ? (
                <div className="space-y-3">{Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-14 rounded-xl" />)}</div>
              ) : recentLeads.length === 0 ? (
                <div className="text-center py-10">
                  <TrendingUp size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No leads yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentLeads.map((lead, i) => (
                    <motion.div key={lead._id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-alt)' }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: 'var(--grad)' }}>
                          {lead.buyer?.name?.[0] || 'B'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{lead.buyer?.name || 'Buyer'}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{(lead.property as any)?.title || 'Property'} · {lead.assignedAgent?.name || 'Unassigned'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={cn('badge text-xs', lead.status === 'new' ? 'badge-blue' : lead.status === 'deal_closed' ? 'badge-green' : 'badge-teal')}>
                            {lead.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{formatDate(lead.createdAt)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Lead sources / campaign performance */}
        {!loading && sources.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-5">
                <Megaphone size={15} style={{ color: 'var(--teal)' }} />
                <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Lead Sources</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Campaign</th>
                      <th>Leads</th>
                      <th>Closed</th>
                      <th>Lost</th>
                      <th>Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sources.map((s, i) => (
                      <tr key={i}>
                        <td className="text-sm capitalize" style={{ color: 'var(--text)' }}>{s.utmSource || s.source}</td>
                        <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {s.utmCampaign || s.utmMedium || '—'}
                        </td>
                        <td className="text-sm font-medium" style={{ color: 'var(--text)' }}>{s.total}</td>
                        <td className="text-sm" style={{ color: 'var(--green)' }}>{s.closed}</td>
                        <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.lost}</td>
                        <td>
                          <span className={cn('badge text-xs', s.conversionRate >= 10 ? 'badge-green' : s.conversionRate > 0 ? 'badge-blue' : 'badge-gray')}>
                            {s.conversionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {stats && stats.pendingApprovals > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="mt-5 card p-5 flex items-start gap-4"
            style={{ background: 'rgba(203,1,1,0.05)', borderColor: 'rgba(203,1,1,0.20)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.10)', border: '1px solid rgba(203,1,1,0.20)' }}>
              <AlertCircle size={18} style={{ color: 'var(--teal)' }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
                {stats.pendingApprovals} listing{stats.pendingApprovals > 1 ? 's' : ''} waiting for your review
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Approve or reject submissions so sellers can go live.
              </p>
            </div>
            <Link href="/admin/properties?status=pending" className="btn-primary btn-sm flex-shrink-0">Review</Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}
