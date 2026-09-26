'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { contactAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { trackLead } from '@/lib/leadTracking'

interface ContactFormProps {
  source: 'contact_form' | 'valuation_request' | 'fast_sale_request'
  messagePlaceholder?: string
  submitLabel?: string
}

// Shared by /contact, /sell-property-fast-dubai, and /free-property-valuation-dubai — only the `source` (used
// server-side to route/label the enquiry for staff) and copy differ.
export default function ContactForm({ source, messagePlaceholder = 'Tell us a bit about what you need…', submitLabel = 'Send Message' }: ContactFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email || !message) {
      toast.error('Please fill in your name, email, and message')
      return
    }
    setLoading(true)
    try {
      await contactAPI.submit({ name, email, phone: phone || undefined, message, source })
      trackLead(
        source === 'valuation_request' ? 'Valuation request submitted' : source === 'fast_sale_request' ? 'Fast sale request submitted' : 'Contact form submitted',
        { name, phone, email },
      )
      setSent(true)
    } catch (err: any) {
      toast.error(err?.error || 'Something went wrong — please try again')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="card p-8 text-center">
        <CheckCircle2 size={40} style={{ color: 'var(--teal)' }} className="mx-auto mb-4" />
        <h3 className="heading-md mb-2">Message Sent</h3>
        <p className="muted">Thanks, {name.split(' ')[0]} — our team will reach out shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-4">
      <div>
        <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Full Name *</label>
        <input className="input w-full" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Email *</label>
          <input className="input w-full" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Phone</label>
          <input className="input w-full" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+971 5X XXX XXXX" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Message *</label>
        <textarea
          className="input w-full"
          rows={5}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={messagePlaceholder}
          style={{ resize: 'vertical', minHeight: 120 }}
          required
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">
        {loading ? <Loader2 size={16} className="animate-spin" /> : submitLabel}
      </button>
    </form>
  )
}
