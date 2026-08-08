'use client'
import { useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { authAPI } from '@/lib/api'
import toast from 'react-hot-toast'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await authAPI.resetPassword(token, data.password)
      setDone(true)
      toast.success('Password reset — you can now sign in')
      setTimeout(() => router.push('/auth/login'), 1800)
    } catch (err: any) {
      toast.error(err?.error || 'Invalid or expired reset link')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center py-4">
        <XCircle size={40} style={{ color: '#FB7185' }} className="mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Invalid Link</h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          This password reset link is missing its token. Please request a new one.
        </p>
        <Link href="/auth/forgot-password" className="btn-primary w-full justify-center mt-6">Request New Link</Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <CheckCircle2 size={40} style={{ color: 'var(--teal)' }} className="mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Password Reset</h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>Redirecting you to sign in…</p>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Set a New Password</h1>
      <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>New Password</label>
          <div className="input-glass flex items-center gap-2 h-12 px-4 rounded-xl">
            <Lock size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
            <input {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
              type={showPw ? 'text' : 'password'}
              className="bg-transparent flex-1 text-sm outline-none" style={{ color: 'var(--text)' }}
              placeholder="Enter new password" />
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
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="card p-8">
          <Suspense fallback={<div className="shimmer h-48 rounded-2xl" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </motion.div>
    </div>
  )
}
