'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User, Mail, Lock, Phone, MessageCircle, ArrowRight, CheckCircle2,
  ShieldCheck, Building2, ChevronRight, Eye, EyeOff,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import FacebookSignInButton from '@/components/auth/FacebookSignInButton'
import { Logo } from '@/components/shared/Logo'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { ConfirmationResult } from 'firebase/auth'
import { firebasePhoneEnabled, sendPhoneCode, confirmPhoneCode, phoneAuthError, toE164, useResendCooldown } from '@/lib/firebase'


const STEPS = ['Account', 'Verify Phone', 'Complete']

export default function SellerRegisterPage() {
  const router = useRouter()
  const { register: authRegister } = useAuthStore()
  const [step,     setStep]     = useState(0)
  const [showPw,   setShowPw]   = useState(false)
  const [phone,    setPhone]    = useState('')
  const [otpSent,  setOtpSent]  = useState(false)
  const [otp,      setOtp]      = useState(['','','','','',''])
  const [loading,  setLoading]  = useState(false)
  const [phoneSubmitting, setPhoneSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null)
  const [resending, setResending] = useState(false)
  const [cooldown, startCooldown] = useResendCooldown()

  // Phone numbers are verified by Firebase SMS only.
  const sendCode = async (rawPhone: string) => {
    if (!firebasePhoneEnabled) throw { error: 'SMS verification is not available right now — please try again later' }
    const e164 = toE164(rawPhone)
    if (!e164) throw { error: 'Enter your phone number with the country code, e.g. +971 50 123 4567' }
    try { setConfirmation(await sendPhoneCode(e164, 'otp-recaptcha')) }
    catch (err) { throw { error: phoneAuthError(err) } }
    setOtp(['','','','','',''])
    startCooldown()
  }

  const { register, handleSubmit, formState: { errors } } = useForm()
  const { register: registerPhone, handleSubmit: handlePhoneSubmit, formState: { errors: phoneErrors } } = useForm()

  const onRegister = async (data: any) => {
    setLoading(true)
    try {
      await authRegister({ ...data, role: 'seller' })
    } catch (err: any) {
      toast.error(err?.error || 'Registration failed')
      setLoading(false)
      return
    }
    try {
      setPhone(data.phone)
      await sendCode(data.phone)
      setOtpSent(true)
      toast.success('Code sent by SMS!')
      setStep(1)
    } catch (err: any) {
      toast.error(err?.error || 'Could not send the code')
      setOtpSent(false)
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  // Google/Facebook don't reliably hand over a phone number — a seller
  // account still isn't usable until its number is SMS-verified, so route straight
  // into the same "Verify Phone" step, just without a phone on file yet.
  const onSocialAuthenticated = () => {
    const user = useAuthStore.getState().user
    if (user?.isPhoneVerified) { setStep(2); return }
    setOtpSent(false)
    setStep(1)
  }

  const submitPhone = async (data: any) => {
    if (confirmation && cooldown > 0 && toE164(data.phone) === toE164(phone)) { setOtpSent(true); return }
    if (cooldown > 0) { toast.error(`Please wait ${cooldown}s before requesting another code`); return }
    setPhoneSubmitting(true)
    try {
      await sendCode(data.phone)
      setPhone(data.phone)
      setOtpSent(true)
      toast.success('Code sent by SMS!')
    } catch (err: any) {
      toast.error(err?.error || 'Failed to send OTP')
    } finally {
      setPhoneSubmitting(false)
    }
  }

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 5) document.getElementById(`otp-${i+1}`)?.focus()
  }

  const verifyOtp = async () => {
    const code = otp.join('')
    if (code.length < 6) { toast.error('Enter 6-digit OTP'); return }
    setLoading(true)
    try {
      if (!confirmation) { toast.error('Request a new code first'); return }
      let idToken: string
      try { idToken = await confirmPhoneCode(confirmation, code) }
      catch (err) { toast.error(phoneAuthError(err)); return }
      const res = await authAPI.verifyPhoneFirebase(idToken)
      if (res.data?.data?.user) useAuthStore.getState().setUser(res.data.data.user)
      toast.success('Phone verified!')
      setStep(2)
    } catch (err: any) {
      toast.error(err?.error || 'Invalid code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resendOtp = async () => {
    if (cooldown > 0) return
    setResending(true)
    try {
      await sendCode(phone)
      toast.success('Code resent by SMS')
    } catch (err: any) {
      toast.error(err?.error || 'Could not resend the code')
    } finally { setResending(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>

      {/* ── Left panel ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'var(--grad)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)', backgroundSize: '60px 60px' }}
        />
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: '#fff' }} />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: '#fff' }} />

        {/* Logo */}
        <div className="flex items-center gap-2.5 relative z-10">
          <Logo href={null} variant="icon" boxed height={30} />
          <span className="font-bold text-lg text-white">Distress Deals</span>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div
            className="mb-6 text-xs tracking-widest uppercase inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
          >
            Seller Registration
          </div>
          <h2 className="heading-lg mb-5 text-white">List Your Property with Confidence</h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Join thousands of sellers who trust Distress Deals UAE to find qualified buyers for their properties.
          </p>

          <div className="space-y-4">
            {[
              { icon: ShieldCheck,  text: 'SMS code verification for security' },
              { icon: Building2,    text: 'Expert team reviews & approves your listing'  },
              { icon: CheckCircle2, text: 'Reach thousands of verified buyers instantly' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-white">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }}>
                  <Icon size={14} />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs relative z-10" style={{ color: 'rgba(255,255,255,0.55)' }}>© 2025 Distress Deals UAE. RERA Licensed.</p>
      </div>

      {/* ── Right panel ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-0 mb-10">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={
                      i <= step
                        ? { background: 'var(--grad)', color: '#fff' }
                        : { background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-muted)' }
                    }
                  >
                    {i < step ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  <span className="text-xs mt-1 whitespace-nowrap" style={{ color: i === step ? 'var(--teal)' : 'var(--text-muted)' }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-16 h-px mx-1 mb-5 transition-colors" style={{ background: i < step ? 'var(--teal)' : 'var(--border)' }} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ── Step 0: Account ────────────────────────── */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Create Seller Account</h1>
                <p className="muted mb-7">Tell us about yourself to get started</p>

                <div className="grid grid-cols-1 gap-2.5 mb-6">
                  <GoogleSignInButton onAuthenticated={onSocialAuthenticated} role="seller" />
                  <FacebookSignInButton onAuthenticated={onSocialAuthenticated} role="seller" />
                </div>
                <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
                  Signing up with Google or Facebook still requires phone verification by SMS code.
                </p>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or sign up with email</span>
                  <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                </div>

                <form onSubmit={handleSubmit(onRegister)} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Full Name *</label>
                    <div className="input-glass flex items-center gap-2 h-12 px-4 rounded-xl">
                      <User size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                      <input {...register('name', { required: 'Name is required' })}
                        className="bg-transparent flex-1 text-sm outline-none" style={{ color: 'var(--text)' }}
                        placeholder="Your full name" />
                    </div>
                    {errors.name && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>{errors.name.message as string}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Email Address *</label>
                    <div className="input-glass flex items-center gap-2 h-12 px-4 rounded-xl">
                      <Mail size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                      <input {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } })}
                        type="email" className="bg-transparent flex-1 text-sm outline-none" style={{ color: 'var(--text)' }}
                        placeholder="your@email.com" />
                    </div>
                    {errors.email && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>{errors.email.message as string}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Mobile Number *</label>
                    <div className="input-glass flex items-center gap-2 h-12 px-4 rounded-xl">
                      <Phone size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                      <input {...register('phone', { required: 'Phone is required' })}
                        className="bg-transparent flex-1 text-sm outline-none" style={{ color: 'var(--text)' }}
                        placeholder="+971 50 000 0000" />
                    </div>
                    <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                      <MessageCircle size={11} style={{ color: 'var(--green)' }} />
                      A verification code will be sent to this number by SMS
                    </p>
                    {errors.phone && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>{errors.phone.message as string}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Password *</label>
                    <div className="input-glass flex items-center gap-2 h-12 px-4 rounded-xl">
                      <Lock size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                      <input {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                        type={showPw ? 'text' : 'password'}
                        className="bg-transparent flex-1 text-sm outline-none" style={{ color: 'var(--text)' }}
                        placeholder="Min 6 characters" />
                      <button type="button" onClick={() => setShowPw(s => !s)} style={{ color: 'var(--text-muted)' }}>
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>{errors.password.message as string}</p>}
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2 disabled:opacity-60">
                    {loading
                      ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Creating…</span>
                      : <><ArrowRight size={15} /> Create Account & Send OTP</>}
                  </button>
                </form>

                <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
                  Already have an account?{' '}
                  <Link href="/seller/login" className="font-semibold transition-colors" style={{ color: 'var(--teal)' }}>Sign in</Link>
                </p>
              </motion.div>
            )}

            {/* ── Step 1: Phone + OTP ─────────────────────── */}
            {step === 1 && !otpSent && (
              <motion.div key="step1-phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(203,1,1,0.10)', border: '1px solid rgba(203,1,1,0.20)' }}>
                  <Phone size={24} style={{ color: 'var(--teal)' }} />
                </div>
                <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Add Your Mobile Number</h1>
                <p className="muted mb-7">Your account needs a verified phone number before you can list properties.</p>

                <form onSubmit={handlePhoneSubmit(submitPhone)} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Mobile Number *</label>
                    <div className="input-glass flex items-center gap-2 h-12 px-4 rounded-xl">
                      <Phone size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                      <input {...registerPhone('phone', { required: 'Phone is required' })}
                        className="bg-transparent flex-1 text-sm outline-none" style={{ color: 'var(--text)' }}
                        placeholder="+971 50 000 0000" />
                    </div>
                    {phoneErrors.phone && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>{phoneErrors.phone.message as string}</p>}
                  </div>

                  <button type="submit" disabled={phoneSubmitting} className="btn-primary w-full py-3.5 disabled:opacity-60">
                    {phoneSubmitting
                      ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Sending…</span>
                      : <><MessageCircle size={15} /> Send SMS Code</>}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 1 && otpSent && (
              <motion.div key="step1-otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(203,1,1,0.10)', border: '1px solid rgba(203,1,1,0.20)' }}>
                  <MessageCircle size={24} style={{ color: 'var(--teal)' }} />
                </div>
                <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Verify via SMS</h1>
                <p className="muted mb-2">We sent a 6-digit code to</p>
                <p className="font-semibold mb-8" style={{ color: 'var(--teal)' }}>{phone}</p>

                <div className="flex gap-3 mb-6">
                  {otp.map((digit, i) => (
                    <input key={i} id={`otp-${i}`} type="text" inputMode="numeric"
                      maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onPaste={e => {
                        const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
                        if (d.length < 2) return
                        e.preventDefault()
                        setOtp(Array.from({ length: 6 }, (_, k) => d[k] || ''))
                        document.getElementById(`otp-${Math.min(d.length, 5)}`)?.focus()
                      }}
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      onKeyDown={e => { if (e.key === 'Backspace' && !digit && i > 0) document.getElementById(`otp-${i-1}`)?.focus() }}
                      className="w-full aspect-square text-center text-lg font-bold rounded-xl border transition-all outline-none"
                      style={{
                        background: digit ? 'rgba(203,1,1,0.08)' : 'var(--surface-alt)',
                        borderColor: digit ? 'var(--teal)' : 'var(--border)',
                        color: digit ? 'var(--teal)' : 'var(--text)',
                      }}
                    />
                  ))}
                </div>

                <button onClick={verifyOtp} disabled={loading || otp.join('').length < 6} className="btn-primary w-full py-3.5 disabled:opacity-60 mb-4">
                  {loading
                    ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Verifying…</span>
                    : <><CheckCircle2 size={15} /> Verify OTP</>}
                </button>

                <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                  Didn't receive it?{' '}
                  <button onClick={resendOtp} disabled={resending || cooldown > 0} className="font-semibold transition-colors disabled:opacity-60" style={{ color: 'var(--teal)' }}>{resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}</button>
                  {' · '}
                  <button onClick={() => setOtpSent(false)} className="font-semibold" style={{ color: 'var(--teal)' }}>Change number</button>
                </p>
              </motion.div>
            )}

            {/* ── Step 2: Complete ───────────────────────── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(253,113,71,0.10)', border: '1px solid rgba(253,113,71,0.25)' }}>
                  <CheckCircle2 size={36} style={{ color: 'var(--green)' }} />
                </div>
                <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text)' }}>Account Created!</h2>
                <p className="muted mb-8 max-w-sm mx-auto leading-relaxed">
                  Your seller account is verified and ready. You can now list your properties for review by our expert team.
                </p>
                <button onClick={() => router.push('/seller/listings/new')} className="btn-primary px-10 py-3.5">
                  Add Your First Listing <ChevronRight size={15} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <div id="otp-recaptcha" />
        </div>
      </div>
    </div>
  )
}