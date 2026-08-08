'use client'
import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, Shuffle, ChevronLeft, ChevronRight, LayoutList, KanbanSquare,
  X, Send, Clock, User as UserIcon, Home, Wallet, Loader2,
  Phone, Mail, MessageCircle, MessageSquare, BedDouble, Bath, Maximize, ExternalLink, ShieldCheck,
  Trash2, AlertTriangle, Check, ListTodo, Plus, CalendarClock, Sparkles, Building2,
} from 'lucide-react'
import { leadAPI, agentAPI, chatAPI, taskAPI } from '@/lib/api'
import { formatDate, formatPrice, cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { Lead, Agent, Task as TaskT } from '@/types'
import toast from 'react-hot-toast'

const STAGES = [
  { value: 'new',           label: 'New',         color: '#60A5FA' },
  { value: 'contacted',     label: 'Contacted',   color: '#31B2DE' },
  { value: 'qualified',     label: 'Qualified',   color: '#31B2DE' },
  { value: 'touring',       label: 'Touring',     color: '#C084FC' },
  { value: 'negotiating',   label: 'Negotiating', color: '#F59E0B' },
  { value: 'deal_closed',   label: 'Closed',      color: '#61BB4D' },
  { value: 'deal_lost',     label: 'Lost',        color: '#FB7185' },
  { value: 'cancelled',     label: 'Cancelled',   color: '#94A3B8' },
]

// ══════════════════════════ Delete / request-deletion ══════════════════════════

function ReasonModal({
  title, placeholder, confirmLabel, submitting, onConfirm, onClose,
}: {
  title: string; placeholder: string; confirmLabel: string; submitting: boolean
  onConfirm: (reason: string) => void; onClose: () => void
}) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose}>
      <div className="card p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{title}</h3>
          <button onClick={onClose} className="btn-ghost btn-sm p-1.5"><X size={14} /></button>
        </div>
        <textarea
          autoFocus
          className="input w-full text-sm resize-none"
          rows={3}
          placeholder={placeholder}
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flex items-center justify-end gap-2 mt-4">
          <button onClick={onClose} className="btn-ghost btn-sm">Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={submitting} className="btn-primary btn-sm gap-1.5">
            {submitting && <Loader2 size={12} className="animate-spin" />} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// An agent can't delete a lead directly — only request it; admin either
// approves (it's actually deleted) or declines (the request is cleared).
function LeadDeleteControl({
  lead, isAdmin, onRequestReason, onChanged,
}: {
  lead: Lead; isAdmin: boolean
  onRequestReason: (lead: Lead) => void
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)

  if (lead.deleteRequest) {
    if (!isAdmin) {
      return <span className="badge badge-gray text-[10px] gap-1 flex-shrink-0"><AlertTriangle size={10} /> Deletion requested</span>
    }
    const approve = async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!confirm('Delete this lead? This cannot be undone.')) return
      setBusy(true)
      try { await leadAPI.approveDeleteRequest(lead._id); toast.success('Lead deleted'); onChanged() }
      catch (err: any) { toast.error(err?.error || 'Failed to delete'); setBusy(false) }
    }
    const reject = async (e: React.MouseEvent) => {
      e.stopPropagation()
      setBusy(true)
      try { await leadAPI.rejectDeleteRequest(lead._id); toast.success('Deletion request declined'); onChanged() }
      catch (err: any) { toast.error(err?.error || 'Failed to decline'); setBusy(false) }
    }
    return (
      <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()} title={lead.deleteRequest.reason}>
        <span className="badge badge-gray text-[10px] gap-1"><AlertTriangle size={10} /> By {lead.deleteRequest.requestedBy?.name || 'agent'}</span>
        {busy ? <Loader2 size={13} className="animate-spin" style={{ color: 'var(--text-muted)' }} /> : (
          <>
            <button onClick={approve} className="btn-ghost btn-sm p-1.5" style={{ color: 'var(--green)' }} title="Approve deletion"><Check size={13} /></button>
            <button onClick={reject} className="btn-ghost btn-sm p-1.5" style={{ color: '#FB7185' }} title="Decline"><X size={13} /></button>
          </>
        )}
      </div>
    )
  }

  const directDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this lead? This cannot be undone.')) return
    setBusy(true)
    try { await leadAPI.delete(lead._id); toast.success('Lead deleted'); onChanged() }
    catch (err: any) { toast.error(err?.error || 'Failed to delete'); setBusy(false) }
  }

  return (
    <button
      onClick={e => { e.stopPropagation(); isAdmin ? directDelete(e) : onRequestReason(lead) }}
      disabled={busy}
      className="btn-ghost btn-sm p-1.5 flex-shrink-0"
      style={{ color: isAdmin ? '#FB7185' : 'var(--text-muted)' }}
      title={isAdmin ? 'Delete lead' : 'Request deletion'}
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
    </button>
  )
}

// ══════════════════════════ Lead detail drawer ══════════════════════════

function ContactCard({ label, name, email, phone }: { label: string; name?: string; email?: string; phone?: string }) {
  const waNumber = phone?.replace(/[^\d]/g, '')
  return (
    <div className="card p-4">
      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text)' }}>{name || '—'}</p>
      {email && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{email}</p>}
      {phone && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{phone}</p>}
      {(email || phone) && (
        <div className="flex items-center gap-1.5 mt-3">
          {phone && (
            <a href={`tel:${phone}`} className="btn-ghost btn-sm p-2" title="Call"><Phone size={13} /></a>
          )}
          {waNumber && (
            <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm p-2" title="WhatsApp" style={{ color: 'var(--green)' }}>
              <MessageCircle size={13} />
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="btn-ghost btn-sm p-2" title="Email"><Mail size={13} /></a>
          )}
        </div>
      )}
    </div>
  )
}

function LeadDetailDrawer({
  leadId, agents, onClose, onChanged,
}: {
  leadId: string
  agents: Agent[]
  onClose: () => void
  onChanged: () => void
}) {
  const router = useRouter()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [submittingNote, setSubmittingNote] = useState(false)
  const [reassigning, setReassigning] = useState(false)
  const [messaging, setMessaging] = useState(false)
  const [showDeleteReason, setShowDeleteReason] = useState(false)
  const [deleteReasonSubmitting, setDeleteReasonSubmitting] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [tasks, setTasks] = useState<TaskT[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDue, setNewTaskDue] = useState('')
  const [taskSubmitting, setTaskSubmitting] = useState(false)

  const loadTasks = useCallback(() => {
    taskAPI.getForLead(leadId).then(r => { if (r.data.success) setTasks(r.data.data) }).catch(() => {})
  }, [leadId])

  useEffect(() => { loadTasks() }, [loadTasks])

  const addTask = async () => {
    if (!newTaskTitle.trim() || !newTaskDue) { toast.error('Add a title and a due date'); return }
    setTaskSubmitting(true)
    try {
      await taskAPI.create({ lead: leadId, title: newTaskTitle.trim(), dueAt: new Date(newTaskDue).toISOString() })
      setNewTaskTitle('')
      setNewTaskDue('')
      loadTasks()
    } catch (err: any) {
      toast.error(err?.error || 'Failed to add task')
    } finally {
      setTaskSubmitting(false)
    }
  }

  const toggleTask = async (task: TaskT) => {
    setTasks(prev => prev.map(t => t._id === task._id ? { ...t, completed: !t.completed } : t))
    try { await taskAPI.complete(task._id) }
    catch { toast.error('Failed to update task'); loadTasks() }
  }

  const removeTask = async (task: TaskT) => {
    setTasks(prev => prev.filter(t => t._id !== task._id))
    try { await taskAPI.delete(task._id) }
    catch { toast.error('Failed to delete task'); loadTasks() }
  }

  const submitDeleteRequest = async (reason: string) => {
    setDeleteReasonSubmitting(true)
    try {
      const res = await leadAPI.requestDelete(leadId, reason || undefined)
      if (res.data.success) setLead(res.data.data)
      setShowDeleteReason(false)
      toast.success('Deletion request sent to admin')
      onChanged()
    } catch (err: any) {
      toast.error(err?.error || 'Failed to send request')
    } finally {
      setDeleteReasonSubmitting(false)
    }
  }

  const load = useCallback(() => {
    setLoading(true)
    leadAPI.getOne(leadId).then(r => { if (r.data.success) setLead(r.data.data) }).catch(() => toast.error('Failed to load lead')).finally(() => setLoading(false))
  }, [leadId])

  useEffect(() => { load(); setAiSummary('') }, [load])

  const generateAiSummary = async () => {
    setAiLoading(true)
    try {
      const res = await leadAPI.aiSummary(leadId)
      if (res.data.success) setAiSummary(res.data.data.summary)
    } catch (err: any) {
      toast.error(err?.error || 'Failed to generate AI brief')
    } finally {
      setAiLoading(false)
    }
  }

  const submitNote = async () => {
    if (!note.trim()) return
    setSubmittingNote(true)
    try {
      const res = await leadAPI.addNote(leadId, note.trim())
      if (res.data.success) setLead(res.data.data)
      setNote('')
      onChanged()
    } catch (err: any) {
      toast.error(err?.error || 'Failed to add note')
    } finally {
      setSubmittingNote(false)
    }
  }

  const handleReassign = async (agentId: string) => {
    if (!agentId) return
    setReassigning(true)
    try {
      const res = await leadAPI.assign(leadId, agentId)
      if (res.data.success) setLead(res.data.data)
      toast.success('Lead reassigned')
      onChanged()
    } catch (err: any) {
      toast.error(err?.error || 'Reassign failed')
    } finally {
      setReassigning(false)
    }
  }

  const messageSeller = async () => {
    if (!seller?._id || !property?._id) return
    setMessaging(true)
    try {
      const res = await chatAPI.createRoom({ type: 'seller_agent', participantId: seller._id, property: property._id })
      onClose()
      router.push(`/admin/messages?room=${res.data.data._id}`)
    } catch {
      toast.error('Failed to open conversation')
    } finally {
      setMessaging(false)
    }
  }

  const stage = STAGES.find(s => s.value === lead?.status)
  const property = lead?.property as any
  const project = lead?.project as any
  const seller = property?.seller
  const amenities = property?.amenities

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="h-full w-full max-w-2xl flex flex-col shadow-2xl" style={{ background: 'var(--bg)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header — fixed */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Lead Details</h2>
          <div className="flex items-center gap-1.5">
            {lead && (
              <LeadDeleteControl
                lead={lead} isAdmin={isAdmin}
                onRequestReason={() => setShowDeleteReason(true)}
                onChanged={() => { onClose(); onChanged() }}
              />
            )}
            <button onClick={onClose} className="btn-ghost btn-sm p-2"><X size={14} /></button>
          </div>
        </div>

        {loading || !lead ? (
          <div className="flex-1 p-6 space-y-3">{Array(5).fill(null).map((_, i) => <div key={i} className="shimmer h-16 rounded-xl" />)}</div>
        ) : (
          <>
            {/* Scrollable body — the ONLY scroll container, so any amount of
                notes/timeline just grows this region instead of nesting
                scrollbars inside a capped-height modal. */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>{lead.buyer?.name || lead.name || 'Guest'}</p>
                    {lead.leadType === 'project' && (
                      <span className="badge text-[10px]" style={{ background: 'rgba(168,85,247,0.15)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.30)' }}>Project Lead</span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Enquiry submitted {formatDate(lead.createdAt)}</p>
                </div>
                <span className="badge" style={{ borderColor: stage?.color, color: stage?.color, background: `${stage?.color}14` }}>{stage?.label}</span>
              </div>

              {/* AI Brief — quick orientation for whoever's picking up this lead */}
              <div className="card p-4" style={{ background: 'rgba(168,85,247,0.05)', borderColor: 'rgba(168,85,247,0.20)' }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#A855F7' }}>
                    <Sparkles size={12} /> AI Brief
                  </p>
                  <button onClick={generateAiSummary} disabled={aiLoading} className="btn-ghost btn-sm gap-1.5 text-xs" style={{ color: '#A855F7' }}>
                    {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    {aiSummary ? 'Regenerate' : 'Generate'}
                  </button>
                </div>
                {aiSummary ? (
                  <p className="text-xs leading-relaxed mt-1.5" style={{ color: 'var(--text-mid)' }}>{aiSummary}</p>
                ) : (
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    Get a quick AI-generated summary of this lead's stage, budget, and what to do next.
                  </p>
                )}
              </div>

              {/* Property / Project — detailed view */}
              {lead.leadType === 'project' ? (
                <div>
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                    <Building2 size={12} /> Off-Plan Project
                  </p>
                  <div className="card p-3 flex gap-3">
                    <div className="w-20 h-20 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-alt)' }}>
                      {project?.coverImage ? (
                        <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 size={20} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{project?.title || '—'}</p>
                        {project?.status && <span className="badge text-[10px] flex-shrink-0 capitalize">{project.status.replace('_', ' ')}</span>}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--teal)' }}>{project?.priceFrom ? `from ${formatPrice(project.priceFrom)}` : '—'}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{project?.developer || '—'}</p>
                      {project?.slug && (
                        <Link href={`/projects/${project.slug}`} target="_blank" className="text-[11px] font-medium mt-2 inline-flex items-center gap-1" style={{ color: 'var(--teal)' }}>
                          View Project <ExternalLink size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                    <Home size={12} /> Property
                  </p>
                  <div className="card p-3 flex gap-3">
                    <div className="w-20 h-20 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-alt)' }}>
                      {property?.images?.[0]?.url ? (
                        <img src={property.images[0].url} alt={property.title} className="w-full h-full object-cover" />
                      ) : (
                        <Home size={20} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{property?.title || '—'}</p>
                        {property?.status && <span className="badge text-[10px] flex-shrink-0 capitalize">{property.status.replace('_', ' ')}</span>}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--teal)' }}>{property?.price ? formatPrice(property.price) : '—'}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {[property?.location?.area, property?.location?.city].filter(Boolean).join(', ') || '—'}
                      </p>
                      {amenities && (
                        <div className="flex items-center gap-3 mt-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          <span className="flex items-center gap-1"><BedDouble size={11} /> {amenities.bedrooms ?? '—'}</span>
                          <span className="flex items-center gap-1"><Bath size={11} /> {amenities.bathrooms ?? '—'}</span>
                          <span className="flex items-center gap-1"><Maximize size={11} /> {amenities.floorArea ? `${amenities.floorArea} sqft` : '—'}</span>
                        </div>
                      )}
                      {property?._id && (
                        <Link href={`/admin/properties/${property._id}`} target="_blank" className="text-[11px] font-medium mt-2 inline-flex items-center gap-1" style={{ color: 'var(--teal)' }}>
                          View Full Listing <ExternalLink size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="card p-3">
                  <p className="text-[10px] flex items-center gap-1.5 mb-1" style={{ color: 'var(--text-muted)' }}><Wallet size={11} /> Budget</p>
                  <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>{lead.budget ? `${formatPrice(lead.budget.min)} – ${formatPrice(lead.budget.max)}` : '—'}</p>
                </div>
                <div className="card p-3">
                  <p className="text-[10px] flex items-center gap-1.5 mb-1" style={{ color: 'var(--text-muted)' }}><Clock size={11} /> Created</p>
                  <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>{formatDate(lead.createdAt)}</p>
                </div>
              </div>

              {/* Assigned agent — admin can reassign directly from here; agents get a read-only view (backend also enforces this). */}
              <div>
                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                  <UserIcon size={12} /> Assigned Agent
                </p>
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <select
                      className="select-field flex-1 py-2 text-xs"
                      value={lead.assignedAgent?._id || ''}
                      disabled={reassigning}
                      onChange={e => handleReassign(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {agents.map(a => (
                        <option key={a._id} value={a.user._id}>{a.user.name}</option>
                      ))}
                    </select>
                    {reassigning && <Loader2 size={14} className="animate-spin flex-shrink-0" style={{ color: 'var(--text-muted)' }} />}
                    <span title="Admin only" className="flex-shrink-0"><ShieldCheck size={13} style={{ color: 'var(--text-muted)' }} /></span>
                  </div>
                ) : (
                  <div className="card p-3">
                    <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>{lead.assignedAgent?.name || 'Unassigned'}</p>
                  </div>
                )}
              </div>

              {/* Communication — buyer + seller contact, side by side */}
              <div>
                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                  <Phone size={12} /> Communication
                </p>
                <div className={cn('grid gap-3', lead.leadType === 'project' ? 'grid-cols-1' : 'grid-cols-2')}>
                  <ContactCard label="Buyer" name={lead.buyer?.name || lead.name} email={lead.email || lead.buyer?.email} phone={lead.phone || lead.buyer?.phone} />
                  {lead.leadType !== 'project' && (
                    <div className="card p-4 flex flex-col">
                      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Seller</p>
                      <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text)' }}>{seller?.name || '—'}</p>
                      {seller?.email && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{seller.email}</p>}
                      {seller?.phone && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{seller.phone}</p>}
                      <button
                        onClick={messageSeller} disabled={messaging || !seller?._id}
                        className="btn-ghost btn-sm gap-1.5 mt-3 self-start text-xs disabled:opacity-40"
                      >
                        {messaging ? <Loader2 size={12} className="animate-spin" /> : <MessageSquare size={12} />}
                        Message Seller
                      </button>
                    </div>
                  )}
                </div>
                {lead.assignedAgent && (
                  <div className="mt-3">
                    <ContactCard label="Assigned Agent" name={lead.assignedAgent.name} email={lead.assignedAgent.email} phone={(lead.assignedAgent as any).phone} />
                  </div>
                )}
              </div>

              {lead.requirements && (
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Requirements</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-mid)' }}>{lead.requirements}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                  <ListTodo size={12} /> Follow-Up Tasks
                </p>
                <div className="space-y-2 mb-3">
                  {tasks.length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No follow-ups scheduled</p>
                  ) : tasks.map(t => {
                    const overdue = !t.completed && new Date(t.dueAt) < new Date()
                    return (
                      <div key={t._id} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: 'var(--bg-alt)' }}>
                        <button
                          onClick={() => toggleTask(t)}
                          className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-colors"
                          style={{ border: `1.5px solid ${t.completed ? 'var(--green)' : 'var(--border)'}`, background: t.completed ? 'var(--green)' : 'transparent' }}
                        >
                          {t.completed && <Check size={11} style={{ color: '#fff' }} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-xs', t.completed && 'line-through')} style={{ color: t.completed ? 'var(--text-muted)' : 'var(--text)' }}>
                            {t.title}
                          </p>
                          <p className="text-[11px] flex items-center gap-1" style={{ color: overdue ? '#FB7185' : 'var(--text-muted)' }}>
                            <CalendarClock size={10} /> {formatDate(t.dueAt)} {overdue && '· Overdue'} {t.assignedTo?.name && `· ${t.assignedTo.name}`}
                          </p>
                        </div>
                        <button onClick={() => removeTask(t)} className="btn-ghost btn-sm p-1.5 flex-shrink-0" style={{ color: '#FB7185' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    className="input flex-1 text-xs" placeholder="Follow-up task…"
                    value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                  />
                  <input
                    type="date" className="input text-xs" style={{ maxWidth: 140 }}
                    value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)}
                  />
                  <button onClick={addTask} disabled={taskSubmitting} className="btn-ghost btn-sm p-2.5 flex-shrink-0">
                    {taskSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text)' }}>Timeline</p>
                <div className="space-y-2.5">
                  {lead.timeline?.length > 0 ? [...lead.timeline].reverse().map((t: any, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--teal)' }} />
                      <div>
                        <p style={{ color: 'var(--text-mid)' }}>
                          {t.description || t.action}
                          {/* createdBy is only present in the API response for admins —
                              stripped server-side for agents, so this simply won't render for them. */}
                          {t.createdBy?.name && <span style={{ color: 'var(--text-muted)' }}> · by {t.createdBy.name}</span>}
                        </p>
                        <p style={{ color: 'var(--text-muted)' }}>{formatDate(t.createdAt)}</p>
                      </div>
                    </div>
                  )) : <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No activity yet</p>}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text)' }}>Notes</p>
                <div className="space-y-2">
                  {lead.notes?.length > 0 ? [...lead.notes].reverse().map((n, i) => (
                    <div key={i} className="p-2.5 rounded-xl text-xs" style={{ background: 'var(--bg-alt)' }}>
                      <p style={{ color: 'var(--text)' }}>{n.content}</p>
                      <p className="mt-1" style={{ color: 'var(--text-muted)' }}>{(n.createdBy as any)?.name || 'Staff'} · {formatDate(n.createdAt)}</p>
                    </div>
                  )) : <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No notes yet</p>}
                </div>
              </div>
            </div>

            {/* Note composer — fixed footer, always reachable regardless of
                how long the body above grows. */}
            <div className="flex-shrink-0 p-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-center gap-2">
                <input className="input flex-1" placeholder="Add an internal note…" value={note}
                  onChange={e => setNote(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submitNote() }} />
                <button onClick={submitNote} disabled={submittingNote || !note.trim()} className="btn-primary btn-sm p-2.5">
                  {submittingNote ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
      {showDeleteReason && (
        <ReasonModal
          title="Request lead deletion"
          placeholder="Why should this lead be deleted? (shown to admin)"
          confirmLabel="Send Request"
          submitting={deleteReasonSubmitting}
          onConfirm={submitDeleteRequest}
          onClose={() => setShowDeleteReason(false)}
        />
      )}
    </div>
  )
}

// ══════════════════════════ Kanban board ══════════════════════════

function LeadCard({ lead, isAdmin, onOpen, onDragStart, onRequestReason, onChanged }: {
  lead: Lead; isAdmin: boolean; onOpen: () => void; onDragStart: () => void
  onRequestReason: (lead: Lead) => void; onChanged: () => void
}) {
  return (
    <div
      draggable onDragStart={onDragStart} onClick={onOpen}
      className="p-3 rounded-xl cursor-pointer transition-shadow hover:shadow-md"
      style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <p className="text-xs font-semibold line-clamp-1" style={{ color: 'var(--text)' }}>{lead.buyer?.name || lead.name || 'Guest'}</p>
        {lead.leadType === 'project' && <span className="badge text-[9px] flex-shrink-0" style={{ background: 'rgba(168,85,247,0.15)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.30)', padding: '1px 5px' }}>Project</span>}
      </div>
      <p className="text-xs line-clamp-1" style={{ color: 'var(--text-muted)' }}>{(lead.property as any)?.title || (lead.project as any)?.title || '—'}</p>
      <div className="flex items-center justify-between mt-2.5">
        <span className={cn('badge', lead.priority === 'high' ? 'badge-red' : lead.priority === 'medium' ? 'badge-blue' : 'badge-gray')} style={{ fontSize: 10, padding: '1px 6px' }}>
          {lead.priority}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{lead.assignedAgent?.name?.split(' ')[0] || 'Unassigned'}</span>
        <LeadDeleteControl lead={lead} isAdmin={isAdmin} onRequestReason={onRequestReason} onChanged={onChanged} />
      </div>
    </div>
  )
}

function LeadsKanban({ leads, isAdmin, onStageChange, onOpen, onRequestReason, onChanged }: {
  leads: Lead[]; isAdmin: boolean; onStageChange: (lead: Lead, status: string) => void; onOpen: (id: string) => void
  onRequestReason: (lead: Lead) => void; onChanged: () => void
}) {
  const dragItem = useRef<Lead | null>(null)

  const byStage = useMemo(() => {
    const grouped: Record<string, Lead[]> = {}
    STAGES.forEach(s => { grouped[s.value] = [] })
    leads.forEach(l => { (grouped[l.status] || (grouped[l.status] = [])).push(l) })
    return grouped
  }, [leads])

  return (
    <div className="flex gap-4 overflow-x-auto pb-3">
      {STAGES.map(stage => (
        <div
          key={stage.value}
          className="flex-shrink-0 w-64 rounded-2xl p-3"
          style={{ background: 'var(--bg-alt)' }}
          onDragOver={e => e.preventDefault()}
          onDrop={() => { if (dragItem.current) onStageChange(dragItem.current, stage.value) }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold" style={{ color: stage.color }}>{stage.label}</h3>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{byStage[stage.value]?.length || 0}</span>
          </div>
          <div className="space-y-2">
            {(byStage[stage.value] || []).map(lead => (
              <LeadCard
                key={lead._id} lead={lead} isAdmin={isAdmin}
                onOpen={() => onOpen(lead._id)} onDragStart={() => { dragItem.current = lead }}
                onRequestReason={onRequestReason} onChanged={onChanged}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════ Page ══════════════════════════

function AdminLeadsView() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const searchParams = useSearchParams()
  const [view, setView] = useState<'list' | 'kanban'>('kanban')
  const [pipeline, setPipeline] = useState<{ status: string; count: number }[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [kanbanLeads, setKanbanLeads] = useState<Lead[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [reasonTarget, setReasonTarget] = useState<Lead | null>(null)
  const [reasonSubmitting, setReasonSubmitting] = useState(false)

  // Deep-link from a notification ("New Lead Assigned" etc.) straight into
  // this lead's detail drawer, instead of just dropping the user on the list.
  useEffect(() => {
    const leadParam = searchParams.get('lead')
    if (leadParam) setDetailId(leadParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  const limit = 15

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      leadAPI.pipeline(),
      leadAPI.getAll({ status: status || undefined, priority: priority || undefined, page, limit }),
    ]).then(([pl, ll]) => {
      if (pl.data.success) setPipeline(pl.data.data)
      if (ll.data.success) { setLeads(ll.data.data.data || []); setTotal(ll.data.data.total || 0) }
    }).catch(() => toast.error('Failed to load leads')).finally(() => setLoading(false))
  }, [status, priority, page])

  const loadKanban = useCallback(() => {
    leadAPI.getAll({ priority: priority || undefined, limit: 300 })
      .then(r => { if (r.data.success) setKanbanLeads(r.data.data.data || []) })
      .catch(() => toast.error('Failed to load pipeline board'))
  }, [priority])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (view === 'kanban') loadKanban() }, [view, loadKanban])
  useEffect(() => { agentAPI.getAll().then(r => { if (r.data.success) setAgents(r.data.data) }).catch(() => {}) }, [])

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await leadAPI.update(id, { status: newStatus })
      toast.success('Lead updated')
      load()
      if (view === 'kanban') loadKanban()
    } catch (err: any) { toast.error(err?.error || 'Update failed') }
  }

  const reassign = async (id: string, agentId: string) => {
    if (!agentId) return
    try { await leadAPI.assign(id, agentId); toast.success('Lead reassigned'); load() }
    catch (err: any) { toast.error(err?.error || 'Reassign failed') }
  }

  const refreshAll = () => { load(); if (view === 'kanban') loadKanban() }

  const confirmDeleteRequest = async (reason: string) => {
    if (!reasonTarget) return
    setReasonSubmitting(true)
    try {
      await leadAPI.requestDelete(reasonTarget._id, reason || undefined)
      toast.success('Deletion request sent to admin')
      setReasonTarget(null)
      refreshAll()
    } catch (err: any) {
      toast.error(err?.error || 'Failed to send request')
    } finally {
      setReasonSubmitting(false)
    }
  }

  const shuffleUnassigned = async () => {
    const ids = leads.filter(l => !l.assignedAgent).map(l => l._id)
    if (ids.length === 0) return toast('No unassigned leads on this page', { icon: 'ℹ️' })
    try { await leadAPI.shuffle(ids); toast.success(`${ids.length} leads redistributed`); load() }
    catch (err: any) { toast.error(err?.error || 'Shuffle failed') }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <header className="flex items-center justify-between px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Leads Pipeline</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Track every buyer enquiry across the funnel</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('list')} className="btn-ghost btn-sm gap-1.5"
            style={view === 'list' ? { color: 'var(--teal)', borderColor: 'rgba(49,178,222,0.40)', background: 'rgba(49,178,222,0.06)' } : undefined}>
            <LayoutList size={13} /> List
          </button>
          <button onClick={() => setView('kanban')} className="btn-ghost btn-sm gap-1.5"
            style={view === 'kanban' ? { color: 'var(--teal)', borderColor: 'rgba(49,178,222,0.40)', background: 'rgba(49,178,222,0.06)' } : undefined}>
            <KanbanSquare size={13} /> Kanban
          </button>
          <button onClick={shuffleUnassigned} className="btn-outline btn-sm gap-2">
            <Shuffle size={13} /> Shuffle Unassigned
          </button>
        </div>
      </header>

      <div className="p-7">
        {/* Pipeline strip */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-6">
          {STAGES.map((s, i) => {
            const count = pipeline.find(p => p.status === s.value)?.count ?? 0
            return (
              <motion.button
                key={s.value}
                onClick={() => { setStatus(status === s.value ? '' : s.value); setPage(1) }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="stat-card text-left"
                style={status === s.value ? { borderColor: s.color } : undefined}
              >
                <p className="text-xl font-bold" style={{ color: s.color }}>{count}</p>
                <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </motion.button>
            )
          })}
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-2 mb-5">
          {['', 'high', 'medium', 'low'].map(p => (
            <button
              key={p || 'all'}
              onClick={() => { setPriority(p); setPage(1) }}
              className="btn-ghost btn-sm capitalize"
              style={priority === p ? { color: 'var(--teal)', borderColor: 'rgba(49,178,222,0.40)', background: 'rgba(49,178,222,0.06)' } : undefined}
            >
              {p || 'All priorities'}
            </button>
          ))}
        </div>

        {view === 'kanban' ? (
          <LeadsKanban
            leads={kanbanLeads} isAdmin={isAdmin}
            onStageChange={(lead, s) => updateStatus(lead._id, s)} onOpen={setDetailId}
            onRequestReason={setReasonTarget} onChanged={refreshAll}
          />
        ) : (
          <>
            <div className="card overflow-hidden">
              {loading ? (
                <div className="p-5 space-y-3">{Array(6).fill(null).map((_, i) => <div key={i} className="shimmer h-12 rounded-xl" />)}</div>
              ) : leads.length === 0 ? (
                <div className="text-center py-16">
                  <TrendingUp size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No leads match this filter</p>
                </div>
              ) : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Buyer</th>
                      <th>Property</th>
                      <th>Budget</th>
                      <th>Agent</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => (
                      <tr key={lead._id}>
                        <td className="cursor-pointer" onClick={() => setDetailId(lead._id)}>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{lead.buyer?.name || lead.name || 'Guest'}</p>
                            {lead.leadType === 'project' && <span className="badge text-[9px] flex-shrink-0" style={{ background: 'rgba(168,85,247,0.15)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.30)', padding: '1px 5px' }}>Project</span>}
                          </div>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{lead.email || lead.buyer?.email}</p>
                        </td>
                        <td className="text-sm truncate max-w-[180px]" style={{ color: 'var(--text)' }}>{(lead.property as any)?.title || (lead.project as any)?.title || '—'}</td>
                        <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {lead.budget ? `${formatPrice(lead.budget.min)} – ${formatPrice(lead.budget.max)}` : '—'}
                        </td>
                        <td>
                          {isAdmin ? (
                            <select
                              className="select-field py-1.5 text-xs"
                              value={lead.assignedAgent?._id || ''}
                              onChange={e => reassign(lead._id, e.target.value)}
                            >
                              <option value="">Unassigned</option>
                              {agents.map(a => (
                                <option key={a._id} value={a.user._id}>{a.user.name}</option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{lead.assignedAgent?.name || 'Unassigned'}</p>
                          )}
                        </td>
                        <td>
                          <span className={cn('badge', lead.priority === 'high' ? 'badge-red' : lead.priority === 'medium' ? 'badge-blue' : 'badge-gray')}>
                            {lead.priority}
                          </span>
                        </td>
                        <td>
                          <select
                            className="select-field py-1.5 text-xs"
                            value={lead.status}
                            onChange={e => updateStatus(lead._id, e.target.value)}
                          >
                            {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </td>
                        <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(lead.createdAt)}</td>
                        <td>
                          <LeadDeleteControl lead={lead} isAdmin={isAdmin} onRequestReason={setReasonTarget} onChanged={refreshAll} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-5">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Page {page} of {totalPages} · {total} leads</p>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost btn-sm p-2 disabled:opacity-40"><ChevronLeft size={14} /></button>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-ghost btn-sm p-2 disabled:opacity-40"><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {detailId && (
          <LeadDetailDrawer leadId={detailId} agents={agents} onClose={() => setDetailId(null)} onChanged={refreshAll} />
        )}
      </AnimatePresence>

      {reasonTarget && (
        <ReasonModal
          title="Request lead deletion"
          placeholder="Why should this lead be deleted? (shown to admin)"
          confirmLabel="Send Request"
          submitting={reasonSubmitting}
          onConfirm={confirmDeleteRequest}
          onClose={() => setReasonTarget(null)}
        />
      )}
    </div>
  )
}

export default function AdminLeadsPage() {
  return (
    <Suspense fallback={null}>
      <AdminLeadsView />
    </Suspense>
  )
}
