'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, Wallet, X, Loader2, CheckCircle2 } from 'lucide-react'
import { mortgageAPI, homepageAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

function calcMonthlyPayment(loanAmount: number, annualRatePct: number, tenureYears: number): number {
  const monthlyRate = annualRatePct / 100 / 12
  const n = tenureYears * 12
  if (n <= 0) return 0
  if (monthlyRate === 0) return loanAmount / n
  return (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
}

function SliderField({ label, value, onChange, min, max, step, format }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; format: (v: number) => string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium" style={{ color: 'var(--text-mid)' }}>{label}</label>
        <span className="text-sm font-bold" style={{ color: 'var(--teal)' }}>{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: 'var(--teal)' }}
      />
    </div>
  )
}

function PreApprovalForm({ inputs, monthlyPayment, onClose }: {
  inputs: { propertyPrice: number; downPayment: number; interestRate: number; tenureYears: number }
  monthlyPayment: number; onClose: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !phone.trim()) { toast.error('Please fill in all fields'); return }
    setSubmitting(true)
    try {
      await mortgageAPI.create({ name, email, phone, ...inputs })
      setDone(true)
    } catch (err: any) {
      toast.error(err?.error || 'Failed to submit — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-sm rounded-3xl shadow-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{done ? 'Request Received' : 'Get Pre-Approved'}</h3>
          <button onClick={onClose} className="btn-ghost btn-sm p-2"><X size={14} /></button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 size={36} style={{ color: 'var(--teal)' }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text)' }}>Thanks, {name.split(' ')[0]}!</p>
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>A mortgage specialist will contact you shortly to discuss your pre-approval.</p>
            <button onClick={onClose} className="btn-primary btn-sm mt-5">Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Estimated monthly payment: <span className="font-bold" style={{ color: 'var(--teal)' }}>{formatPrice(Math.round(monthlyPayment))}/mo</span>
            </p>
            <input className="input" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
            <input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="input" type="tel" placeholder="Phone (e.g. +971 5X XXX XXXX)" value={phone} onChange={e => setPhone(e.target.value)} required />
            <button type="submit" disabled={submitting} className="btn-primary w-full justify-center mt-2">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Request Pre-Approval'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}

export default function MortgageSection() {
  return (
    <Suspense fallback={null}>
      <MortgageSectionInner />
    </Suspense>
  )
}

function MortgageSectionInner() {
  const searchParams = useSearchParams()
  const [propertyPrice, setPropertyPrice] = useState(2_000_000)
  const [downPaymentPct, setDownPaymentPct] = useState(20)
  const [interestRate, setInterestRate] = useState(4.5)
  const [tenureYears, setTenureYears] = useState(25)
  const [showForm, setShowForm] = useState(false)

  // Deep-linked from a property detail page's "Calculate My Mortgage" button
  // (?mortgagePrice=...#mortgage-calculator) — pre-fill and scroll to this
  // section instead of leaving it at the generic default price.
  useEffect(() => {
    const price = Number(searchParams.get('mortgagePrice'))
    if (price > 0) {
      setPropertyPrice(price)
      document.getElementById('mortgage-calculator')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const downPayment = Math.round(propertyPrice * (downPaymentPct / 100))
  const loanAmount = propertyPrice - downPayment
  const monthlyPayment = useMemo(() => calcMonthlyPayment(loanAmount, interestRate, tenureYears), [loanAmount, interestRate, tenureYears])
  const totalPayment = monthlyPayment * tenureYears * 12
  const totalInterest = totalPayment - loanAmount

  return (
    <section id="mortgage-calculator" className="section section-alt">
      <div className="wrap">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="eyebrow mb-3">Plan Your Purchase</p>
          <h2 className="heading-lg mb-4">
            Mortgage <span className="grad-text">Calculator</span>
          </h2>
          <p className="max-w-lg mx-auto" style={{ color: 'var(--text-muted)' }}>
            Estimate your monthly payments and see if a property fits your budget in seconds.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden max-w-4xl mx-auto"
          style={{ border: '1px solid var(--border)' }}
        >
          {/* Inputs */}
          <div className="p-8 space-y-6" style={{ background: 'var(--surface)' }}>
            <SliderField
              label="Property Price" value={propertyPrice} onChange={setPropertyPrice}
              min={300_000} max={20_000_000} step={50_000} format={v => formatPrice(v)}
            />
            <SliderField
              label="Down Payment" value={downPaymentPct} onChange={setDownPaymentPct}
              min={5} max={80} step={5} format={v => `${v}% (${formatPrice(Math.round(propertyPrice * (v / 100)))})`}
            />
            <SliderField
              label="Interest Rate" value={interestRate} onChange={setInterestRate}
              min={2} max={8} step={0.1} format={v => `${v.toFixed(1)}%`}
            />
            <SliderField
              label="Loan Tenure" value={tenureYears} onChange={setTenureYears}
              min={5} max={30} step={1} format={v => `${v} years`}
            />
          </div>

          {/* Results */}
          <div className="p-8 flex flex-col justify-center relative overflow-hidden" style={{ background: 'var(--grad)' }}>
            <div className="absolute pointer-events-none" style={{ top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Calculator size={18} style={{ color: '#fff' }} />
                <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.85)' }}>Estimated Monthly Payment</span>
              </div>
              <p className="text-4xl font-extrabold text-white mb-8">{formatPrice(Math.round(monthlyPayment))}<span className="text-base font-medium">/mo</span></p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'rgba(255,255,255,0.75)' }}>Loan Amount</span>
                  <span className="font-semibold text-white">{formatPrice(loanAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'rgba(255,255,255,0.75)' }}>Total Interest</span>
                  <span className="font-semibold text-white">{formatPrice(Math.round(totalInterest))}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'rgba(255,255,255,0.75)' }}>Total Payment</span>
                  <span className="font-semibold text-white">{formatPrice(Math.round(totalPayment))}</span>
                </div>
              </div>

              <button onClick={() => { setShowForm(true); homepageAPI.trackCta('mortgage_get_preapproved').catch(() => {}) }} className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                style={{ background: '#fff', color: 'var(--teal)' }}>
                <Wallet size={15} /> Get Pre-Approved
              </button>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Estimate only — actual rates and eligibility depend on bank assessment and UAE Central Bank mortgage regulations.
        </p>
      </div>

      <AnimatePresence>
        {showForm && (
          <PreApprovalForm
            inputs={{ propertyPrice, downPayment, interestRate, tenureYears }}
            monthlyPayment={monthlyPayment}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
