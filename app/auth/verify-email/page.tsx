'use client'
import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const setUser = useAuthStore(s => s.setUser)
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('This verification link is missing its token.'); return }
    authAPI.verifyEmail(token)
      .then(res => {
        setStatus('success')
        if (res.data.data?.user) setUser(res.data.data.user)
      })
      .catch(err => {
        setStatus('error')
        setMessage(err?.error || 'This verification link is invalid or has expired.')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (status === 'verifying') {
    return (
      <div className="text-center py-4">
        <Loader2 size={40} style={{ color: 'var(--teal)' }} className="mx-auto mb-4 animate-spin" />
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Verifying Your Email…</h1>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center py-4">
        <CheckCircle2 size={40} style={{ color: 'var(--teal)' }} className="mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Email Verified!</h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
          Your email address has been confirmed. Your account is fully active.
        </p>
        <Link href="/buyer/properties" className="btn-primary w-full justify-center">Continue Browsing</Link>
      </div>
    )
  }

  return (
    <div className="text-center py-4">
      <XCircle size={40} style={{ color: '#FB7185' }} className="mx-auto mb-4" />
      <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Verification Failed</h1>
      <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>{message}</p>
      <Link href="/auth/login" className="btn-primary w-full justify-center">Back to Sign In</Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="card p-8">
          <Suspense fallback={<div className="shimmer h-48 rounded-2xl" />}>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </motion.div>
    </div>
  )
}
