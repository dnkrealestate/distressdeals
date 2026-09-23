'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, MessageCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const resetPasswordWithOtp = useAuthStore(s => s.resetPasswordWithOtp)
  const [step, setStep] = useState<'phone' | 'code' | 'done'>('phone')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const { register, handleSubmit, watch, formState: { errors }, reset: resetForm } = useForm()
  const password = watch('password')

  const sendCode = async () => {
    if (!phone.trim()) { toast.error('Enter your phone number'); return }
    setLoading(true)
    try {
      await authAPI.sendForgotPasswordOtp(phone.trim())
      setStep('code')
      toast.success('If that number is registered, a code is on its way')
    } catch (err: any) {
      toast.error(err?.error || 'Something went wrong — please try again')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await resetPasswordWithOtp(phone.trim(), data.code.trim(), data.password)
      setStep('done')
      toast.success('Password reset — you’re signed in')
      setTimeout(() => router.push('/'), 1500)
    } catch (err: any) {
      toast.error(err?.error || 'That code is not right')
    } finally {
      setLoading(false)
    }
  }

  const changeNumber = () => {
    setStep('phone')
    resetForm()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="card p-8">
          {step === 'done' ? (
            <div className="text-center py-4">
              <CheckCircle2 size={40} style={{ color: 'var(--teal)' }} className="mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Password Reset</h1>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>You're signed in — redirecting you now…</p>
            </div>
          ) : step === 'phone' ? (
            <>
              <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Forgot Password?</h1>
              <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>
                Enter your registered phone number and we'll WhatsApp you a code to reset your password.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Phone Number</label>
                  <div className="input-glass flex items-center gap-2 h-12 px-4 rounded-xl">
                    <Phone size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendCode()}
                      className="bg-transparent flex-1 text-sm outline-none" style={{ color: 'var(--text)' }}
                      placeholder="+971 50 123 4567" />
                  </div>
                </div>

                <button onClick={sendCode} disabled={loading} className="btn-primary w-full py-3.5 mt-2 disabled:opacity-60">
                  {loading
                    ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Sending…</span>
                    : <><MessageCircle size={15} /> Send WhatsApp Code</>}
                </button>
              </div>

              <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
                Remembered your password?{' '}
                <Link href="/auth/login" className="font-semibold" style={{ color: 'var(--teal)' }}>Sign in</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Enter the Code</h1>
              <p className="text-sm mb-1" style={{ color: 'var(--text-mid)' }}>
                We sent a 6-digit code to <strong>{phone}</strong> on WhatsApp
              </p>
              <button onClick={changeNumber} className="text-xs mb-6 flex items-center gap-1" style={{ color: 'var(--teal)' }}>
                <ArrowLeft size={12} /> Change number
              </button>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Verification Code</label>
                  <input {...register('code', { required: 'Enter the 6-digit code' })}
                    inputMode="numeric" maxLength={6}
                    className="input w-full tracking-[0.4em] text-center font-semibold" placeholder="••••••" />
                  {errors.code && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>{errors.code.message as string}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>New Password</label>
                  <div className="input-glass flex items-center gap-2 h-12 px-4 rounded-xl">
                    <Lock size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                    <input {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                      type={showPw ? 'text' : 'password'}
                      className="bg-transparent flex-1 text-sm outline-none" style={{ color: 'var(--text)' }}
                      placeholder="Choose a new password" />
                    <button type="button" onClick={() => setShowPw(s => !s)} style={{ color: 'var(--text-muted)' }}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>{errors.password.message as string}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Confirm New Password</label>
                  <div className="input-glass flex items-center gap-2 h-12 px-4 rounded-xl">
                    <Lock size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                    <input {...register('confirmPassword', { required: 'Please confirm your password', validate: (v: string) => v === password || 'Passwords do not match' })}
                      type={showPw ? 'text' : 'password'}
                      className="bg-transparent flex-1 text-sm outline-none" style={{ color: 'var(--text)' }}
                      placeholder="Re-enter new password" />
                  </div>
                  {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>{errors.confirmPassword.message as string}</p>}
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2 disabled:opacity-60">
                  {loading
                    ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Resetting…</span>
                    : <><ArrowRight size={15} /> Reset Password</>}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
