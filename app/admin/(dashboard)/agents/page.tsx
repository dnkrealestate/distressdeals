'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Plus, X, Trash2, ShieldCheck, Users as UsersIcon, TrendingUp, Trophy, Clock, DollarSign, List } from 'lucide-react'
import { agentAPI, leadAPI } from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { cn, formatDate, formatPrice } from '@/lib/utils'
import { IdTag } from '@/components/shared/UserIdChip'
import type { Agent, AgentPermission, Lead, AgentPerformance } from '@/types'
import toast from 'react-hot-toast'
import { OPERATION_MODULES, CONTENT_MODULES } from '@/lib/modules'

// Every module an agent can hold (lib/modules.ts), plus the legacy umbrella that covers all website content.
const ALL_PERMISSIONS: { value: AgentPermission; label: string }[] = [
  ...OPERATION_MODULES.map(m => ({ value: m.key, label: m.label })),
  { value: 'manage_content', label: 'All website content' },
  ...CONTENT_MODULES.map(m => ({ value: m.key, label: m.label })),
]

const ROLES = ['agent', 'senior_agent', 'team_leader', 'manager']

const LEAD_BADGE: Record<string, string> = {
  new: 'badge-blue', contacted: 'badge-teal', qualified: 'badge-teal',
  touring: 'badge-purple', negotiating: 'badge-blue',
  deal_closed: 'badge-green', deal_lost: 'badge-red', cancelled: 'badge-gray',
}

function PresenceDot({ online }: { online?: boolean }) {
  return (
    <span
      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ background: online ? 'var(--green)' : 'var(--text-muted)', opacity: online ? 1 : 0.5 }}
      title={online ? 'Online' : 'Offline'}
    />
  )
}

function CreateAgentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { name: '', email: '', password: '', phone: '', agentRole: 'agent' },
  })

  const onSubmit = async (data: any) => {
    try {
      await agentAPI.create({ ...data, permissions: ['manage_leads', 'schedule_meetings'] })
      toast.success('Agent created')
      onCreated()
      onClose()
    } catch (err: any) { toast.error(err?.error || 'Failed to create agent') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>New Team Member</h2>
          <button onClick={onClose} className="btn-ghost btn-sm p-2"><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-3">
          <input className="input" placeholder="Full name" {...register('name', { required: true })} />
          <input className="input" type="email" placeholder="Email" {...register('email', { required: true })} />
          <input className="input" type="password" placeholder="Password" {...register('password', { required: true, minLength: 6 })} />
          <input className="input" placeholder="Phone (optional)" {...register('phone')} />
          <select className="select-field" {...register('agentRole')}>
            {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center mt-2">
            {isSubmitting ? 'Creating…' : 'Create Agent'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default function AdminAgentsPage() {
  const [view, setView] = useState<'roster' | 'performance'>('roster')
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [expandedPerms, setExpandedPerms] = useState<string | null>(null)
  const [expandedLeads, setExpandedLeads] = useState<string | null>(null)
  const [leadsByAgent, setLeadsByAgent] = useState<Record<string, Lead[]>>({})
  const [loadingLeads, setLoadingLeads] = useState<string | null>(null)
  const [performance, setPerformance] = useState<AgentPerformance[]>([])
  const [performanceLoading, setPerformanceLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    agentAPI.getAll().then(r => { if (r.data.success) setAgents(r.data.data) })
      .catch(() => toast.error('Failed to load agents')).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (view !== 'performance') return
    setPerformanceLoading(true)
    agentAPI.getPerformance()
      .then(r => { if (r.data.success) setPerformance(r.data.data) })
      .catch(() => toast.error('Failed to load performance report'))
      .finally(() => setPerformanceLoading(false))
  }, [view])

  // Live presence updates via socket — no polling/refresh needed
  useEffect(() => {
    const socket = getSocket()
    const onSnapshot = ({ onlineUserIds }: { onlineUserIds: string[] }) => {
      const online = new Set(onlineUserIds)
      setAgents(prev => prev.map(a => ({ ...a, isOnline: online.has(a.user._id) })))
    }
    const onUpdate = ({ userId, online }: { userId: string; online: boolean }) => {
      setAgents(prev => prev.map(a => a.user._id === userId ? { ...a, isOnline: online } : a))
    }
    socket.on('presence_snapshot', onSnapshot)
    socket.on('presence_update', onUpdate)
    return () => {
      socket.off('presence_snapshot', onSnapshot)
      socket.off('presence_update', onUpdate)
    }
  }, [])

  const onlineCount = useMemo(() => agents.filter(a => a.isOnline).length, [agents])

  const togglePermission = async (agent: Agent, perm: AgentPermission) => {
    const next = agent.permissions.includes(perm)
      ? agent.permissions.filter(p => p !== perm)
      : [...agent.permissions, perm]
    try {
      await agentAPI.updatePermissions(agent._id, next)
      setAgents(prev => prev.map(a => a._id === agent._id ? { ...a, permissions: next } : a))
    } catch (err: any) { toast.error(err?.error || 'Failed to update permissions') }
  }

  const toggleAvailable = async (agent: Agent) => {
    try {
      await agentAPI.update(agent._id, { isAvailable: !agent.isAvailable })
      setAgents(prev => prev.map(a => a._id === agent._id ? { ...a, isAvailable: !a.isAvailable } : a))
    } catch (err: any) { toast.error(err?.error || 'Failed to update') }
  }

  const remove = async (agent: Agent) => {
    if (!confirm(`Remove ${agent.user.name}? Their active leads will be reassigned.`)) return
    try {
      await agentAPI.delete(agent._id)
      toast.success('Agent removed, leads reassigned')
      load()
    } catch (err: any) { toast.error(err?.error || 'Failed to remove agent') }
  }

  const toggleLeadsPanel = async (agent: Agent) => {
    const next = expandedLeads === agent._id ? null : agent._id
    setExpandedLeads(next)
    if (next && !leadsByAgent[agent._id]) {
      setLoadingLeads(agent._id)
      try {
        const r = await leadAPI.getAll({ assignedAgent: agent.user._id, limit: 10 })
        if (r.data.success) setLeadsByAgent(prev => ({ ...prev, [agent._id]: r.data.data.data || [] }))
      } catch { toast.error('Failed to load leads') }
      finally { setLoadingLeads(null) }
    }
  }

  return (
    <div>
      <header className="flex items-center justify-between px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Agents</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage the centralized team and their access</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="badge badge-green">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }} />
            {onlineCount} Online
          </div>
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {([['roster', List], ['performance', Trophy]] as const).map(([v, Icon]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="p-2 transition-colors"
                title={v === 'roster' ? 'Roster' : 'Performance'}
                style={{
                  background: view === v ? 'rgba(203,1,1,0.10)' : 'transparent',
                  color:      view === v ? 'var(--teal)' : 'var(--text-muted)',
                }}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
          {view === 'roster' && (
            <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm gap-2">
              <Plus size={13} /> Add Agent
            </button>
          )}
        </div>
      </header>

      <div className="p-7">
        {view === 'performance' ? (
          performanceLoading ? (
            <div className="space-y-3">{Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-16 rounded-2xl" />)}</div>
          ) : performance.length === 0 ? (
            <div className="text-center py-16">
              <Trophy size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No performance data yet</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Leads</th>
                    <th>Closed</th>
                    <th>Lost</th>
                    <th>Conversion</th>
                    <th>Avg. Response</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((p, i) => (
                    <tr key={p.agentId}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          {i === 0 && p.closedDeals > 0 && <Trophy size={14} style={{ color: '#F59E0B' }} />}
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'var(--grad)' }}>
                            {p.user?.name?.[0] || 'A'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{p.user?.name}</p>
                            <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{p.agentRole.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm" style={{ color: 'var(--text)' }}>{p.totalLeads}</td>
                      <td className="text-sm font-medium" style={{ color: 'var(--green)' }}>{p.closedDeals}</td>
                      <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{p.lostDeals}</td>
                      <td>
                        <span className={cn('badge text-xs', p.conversionRate >= 15 ? 'badge-green' : p.conversionRate > 0 ? 'badge-blue' : 'badge-gray')}>
                          {p.conversionRate}%
                        </span>
                      </td>
                      <td className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <Clock size={11} />
                        {p.avgResponseMinutes === null ? '—' : p.avgResponseMinutes < 60 ? `${p.avgResponseMinutes}m` : `${(p.avgResponseMinutes / 60).toFixed(1)}h`}
                      </td>
                      <td className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text)' }}>
                        <DollarSign size={11} style={{ color: 'var(--text-muted)' }} /> {formatPrice(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : loading ? (
          <div className="space-y-3">{Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-20 rounded-2xl" />)}</div>
        ) : agents.length === 0 ? (
          <div className="text-center py-16">
            <UsersIcon size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No agents yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((a, i) => (
              <motion.div key={a._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: 'var(--grad)' }}>
                      {a.user?.name?.[0] || 'A'}
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                      style={{ background: a.isOnline ? 'var(--green)' : 'var(--text-muted)', borderColor: 'var(--surface)', opacity: a.isOnline ? 1 : 0.6 }}
                      title={a.isOnline ? 'Online' : 'Offline'}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{a.user?.name}<IdTag id={a.user?.displayId} /></p>
                      <span className="badge badge-teal text-xs capitalize">{a.agentRole?.replace('_', ' ')}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.agentId}</span>
                      <span className={cn('badge text-[10px]', a.isOnline ? 'badge-green' : 'badge-gray')}>
                        {a.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.user?.email}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <button onClick={() => toggleLeadsPanel(a)} className="text-right cursor-pointer">
                      <p className="text-sm font-bold" style={{ color: expandedLeads === a._id ? 'var(--teal)' : 'var(--text)' }}>{a.activeLeadsCount}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Active Leads</p>
                    </button>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{a.closedDealsCount}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Closed</p>
                    </div>
                    <button
                      onClick={() => toggleAvailable(a)}
                      className={cn('badge cursor-pointer', a.isAvailable ? 'badge-green' : 'badge-gray')}
                    >
                      {a.isAvailable ? 'Available' : 'Unavailable'}
                    </button>
                    <button onClick={() => toggleLeadsPanel(a)} className="btn-ghost btn-sm p-2" title="Leads in progress">
                      <TrendingUp size={14} />
                    </button>
                    <button onClick={() => setExpandedPerms(expandedPerms === a._id ? null : a._id)} className="btn-ghost btn-sm p-2" title="Permissions">
                      <ShieldCheck size={14} />
                    </button>
                    <button onClick={() => remove(a)} className="btn-ghost btn-sm p-2" style={{ color: '#FB7185' }} title="Remove">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedPerms === a._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--border-soft)' }}
                    >
                      {ALL_PERMISSIONS.map(p => {
                        const has = a.permissions.includes(p.value)
                        return (
                          <button
                            key={p.value}
                            onClick={() => togglePermission(a, p.value)}
                            className={cn('badge cursor-pointer', has ? 'badge-teal' : 'badge-gray')}
                          >
                            {p.label}
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {expandedLeads === a._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-soft)' }}
                    >
                      {loadingLeads === a._id ? (
                        <div className="space-y-2">{Array(3).fill(null).map((_, j) => <div key={j} className="shimmer h-12 rounded-xl" />)}</div>
                      ) : (leadsByAgent[a._id]?.length ?? 0) === 0 ? (
                        <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No leads assigned</p>
                      ) : (
                        <div className="space-y-2">
                          {leadsByAgent[a._id].map(lead => (
                            <div key={lead._id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'var(--bg-alt)' }}>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{lead.buyer?.name || 'Buyer'}</p>
                                <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{(lead.property as any)?.title || 'Property'}</p>
                              </div>
                              <span className={cn('badge text-[10px] flex-shrink-0', LEAD_BADGE[lead.status] || 'badge-gray')}>{lead.status.replace('_', ' ')}</span>
                              <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{formatDate(lead.createdAt)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && <CreateAgentModal onClose={() => setShowCreate(false)} onCreated={load} />}
      </AnimatePresence>
    </div>
  )
}
