'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { authAPI } from '@/lib/api'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await authAPI.forgotPassword(data.email)
      setSent(true)
    } catch (err: any) {
      toast.error(err?.error || 'Something went wrong — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="card p-8">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle2 size={40} style={{ color: 'var(--teal)' }} className="mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Check Your Email</h1>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                If an account exists for that email, we've sent a link to reset your password. It expires in 1 hour.
              </p>
              <Link href="/auth/login" className="btn-primary w-full justify-center mt-6">
                <ArrowLeft size={15} /> Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Forgot Password?</h1>
              <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>
                Enter your email and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Email Address</label>
                  <div className="input-glass flex items-center gap-2 h-12 px-4 rounded-xl">
                    <Mail size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                    <input {...register('email', { required: 'Email is required' })}
                      type="email" className="bg-transparent flex-1 text-sm outline-none" style={{ color: 'var(--text)' }}
                      placeholder="your@email.com" />
                  </div>
                  {errors.email && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>{errors.email.message as string}</p>}
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2 disabled:opacity-60">
                  {loading
                    ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Sending…</span>
                    : <><ArrowRight size={15} /> Send Reset Link</>}
                </button>
              </form>

              <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
                Remembered your password?{' '}
                <Link href="/auth/login" className="font-semibold" style={{ color: 'var(--teal)' }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
