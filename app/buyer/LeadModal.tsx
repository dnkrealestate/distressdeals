'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Send, CheckCircle2, MapPin, Bed, Maximize2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { leadAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { getStoredUtm } from '@/lib/utm'
import { formatPrice, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { trackLead } from '@/lib/leadTracking'
import AccountStep, { type LeadAccountMeta } from '@/components/buyer/AccountStep'
import type { Property } from '@/types'

interface Props { property: Property; onClose: () => void }

export default function LeadModal({ property, onClose }: Props) {
  const { user } = useAuthStore()
  const [submitted, setSubmitted] = useState(false)
  const [outcome, setOutcome] = useState<{ duplicate?: boolean; email?: string } & LeadAccountMeta>({})
  const [loading, setLoading]     = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name:         user?.name || '',
      email:        user?.email || '',
      phone:        user?.phone || '',
      requirements: '',
      budget:       '',
    }
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const res = await leadAPI.create({
        property: property._id,
        ...data,
        budget: data.budget ? { min: 0, max: Number(data.budget) } : undefined,
        ...getStoredUtm(),
      })
      trackLead('Property enquiry submitted', {
        name: data.name, phone: data.phone, email: data.email,
        extra: { property: property.title, ref: property._id },
      })
      setOutcome({ ...res.data.meta, email: data.email })
      setSubmitted(true)
    } catch (err: any) {
      toast.error(err?.error || 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.60)', backdropFilter:'blur(6px)' }}>
      <motion.div initial={{ opacity:0, scale:0.94, y:12 }} animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.94 }} transition={{ duration:0.25 }}
        className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Express Interest</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Our team will contact you within 2 hours</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-alt)', color: 'var(--text-muted)' }}>
            <X size={15} />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Property mini */}
            <div className="mx-6 mt-5 rounded-xl p-4 flex gap-3" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.10)' }}>
                <MapPin size={20} style={{ color: 'var(--teal)' }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{property.title}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{property.location.area}, {property.location.city}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-sm font-bold grad-text">{formatPrice(property.price)}</span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Bed size={10} />{property.amenities.bedrooms || 'Studio'}
                  </span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Maximize2 size={10} />{property.amenities.floorArea?.toLocaleString()} sqft
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Full Name *</label>
                  <input {...register('name', { required: true })}
                    className={cn('input text-sm py-2.5', errors.name && 'border-red-500/40')}
                    placeholder="Your full name" />
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Phone *</label>
                  <input {...register('phone', { required: true })}
                    className={cn('input text-sm py-2.5', errors.phone && 'border-red-500/40')}
                    placeholder="+971 50 000 0000" />
                </div>
              </div>

              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Email *</label>
                <input {...register('email', { required: true })} type="email"
                  className={cn('input text-sm py-2.5', errors.email && 'border-red-500/40')}
                  placeholder="your@email.com" />
              </div>

              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Budget (AED)</label>
                <input {...register('budget')} type="number"
                  className="input text-sm py-2.5"
                  placeholder="Your maximum budget" />
              </div>

              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Requirements / Notes</label>
                <textarea {...register('requirements')} rows={3}
                  className="input text-sm py-2.5 resize-none"
                  placeholder="Any specific requirements, preferred move-in date, etc." />
              </div>

              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                By submitting, you agree to be contacted by our team regarding this property. We never share your details with third parties.
              </p>

              <button type="submit" disabled={loading}
                className="btn-primary w-full py-3.5 text-sm disabled:opacity-60">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  <><Send size={15} /> Submit Enquiry</>
                )}
              </button>
            </div>
          </form>
        ) : (
          <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
            className="p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(203,1,1,0.10)', border: '1px solid rgba(203,1,1,0.20)' }}>
              <CheckCircle2 size={28} style={{ color: 'var(--teal)' }} />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>Enquiry Submitted!</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-mid)' }}>
              {outcome.duplicate
                ? 'You’ve already asked about this property — our team has your request and will be in touch.'
                : 'Our team has received your interest and will reach out within 2 hours to discuss this property and schedule a viewing.'}
            </p>
            {/* AccountStep no-ops on its own when the backend didn't resolve a buyer (e.g. an already-signed-in
                submitter) — checking isAuthenticated here too would hide its own "you're in" confirmation the
                moment claiming/logging in flips that flag to true. */}
            <AccountStep meta={outcome} email={outcome.email || ''} onDone={onClose} />
            <button onClick={onClose} className="btn-primary px-8 mt-6">Done</button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}