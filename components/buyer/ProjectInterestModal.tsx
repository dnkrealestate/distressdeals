'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, CheckCircle2, Loader2 } from 'lucide-react'
import { leadAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { trackLead } from '@/lib/leadTracking'
import AccountStep, { type LeadAccountMeta } from '@/components/buyer/AccountStep'

export default function ProjectInterestModal({
  projectId, projectTitle, open, onClose,
}: { projectId: string; projectTitle: string; open: boolean; onClose: () => void }) {
  const { user } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [outcome, setOutcome] = useState<{ duplicate?: boolean } & LeadAccountMeta>({})

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !phone.trim()) { toast.error('Name, email, and phone are required'); return }
    setSubmitting(true)
    try {
      const res = await leadAPI.createProjectLead({ project: projectId, name: name.trim(), email: email.trim(), phone: phone.trim(), message: message.trim() || undefined })
      trackLead('Project enquiry submitted', {
        name: name.trim(), phone: phone.trim(), email: email.trim(),
        extra: { project: projectTitle, ref: projectId },
      })
      setOutcome(res.data.meta || {})
      setSent(true)
    } catch (err: any) {
      toast.error(err?.error || 'Failed to send — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  const close = () => {
    onClose()
    setTimeout(() => setSent(false), 300)
  }

  // Rendered into <body>, not where it's used: on project cards the modal would otherwise sit inside the card's <a>,
  // and cancelling clicks there (to stop the card navigating) also cancelled the Send button — the form never sent.
  if (typeof document === 'undefined') return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={e => { e.preventDefault(); e.stopPropagation(); close() }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <div className="min-w-0">
                <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>I'm Interested</h3>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{projectTitle}</p>
              </div>
              <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); close() }} className="btn-ghost btn-sm p-2 flex-shrink-0">
                <X size={14} />
              </button>
            </div>

            {sent ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(253,113,71,0.10)', border: '1px solid rgba(253,113,71,0.25)' }}>
                  <CheckCircle2 size={26} style={{ color: 'var(--green)' }} />
                </div>
                <h4 className="font-semibold text-sm mb-1.5" style={{ color: 'var(--text)' }}>Thanks — we've got it!</h4>
                <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
                  {outcome.duplicate
                    ? `You’ve already asked about ${projectTitle} — our team has your request and will be in touch.`
                    : `A member of our team will reach out shortly with more details on ${projectTitle}.`}
                </p>
                {/* AccountStep no-ops on its own when the backend didn't resolve a buyer — checking isAuthenticated
                    here too would hide its own "you're in" confirmation once logging in flips that flag to true. */}
                <AccountStep meta={outcome} email={email} onDone={close} />
                <button onClick={close} className="btn-primary btn-sm w-full mt-5">Done</button>
              </div>
            ) : (
              <form onSubmit={submit} className="p-5 space-y-3">
                <input className="input" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />
                <input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                <input className="input" type="tel" placeholder="Phone (e.g. +971 5X XXX XXXX)" value={phone} onChange={e => setPhone(e.target.value)} required />
                <textarea className="input" rows={3} placeholder="Anything specific you'd like to know? (optional)" value={message} onChange={e => setMessage(e.target.value)} />
                <button type="submit" disabled={submitting} className="btn-primary w-full justify-center gap-2">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {submitting ? 'Sending…' : 'Send Interest'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
