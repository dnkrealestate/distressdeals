'use client'
import { useState } from 'react'
import { Mail, X, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authAPI } from '@/lib/api'
import toast from 'react-hot-toast'

// Buyers/sellers self-register and may not have verified their email yet —
// staff accounts (agent/admin/super_admin) are provisioned internally, so
// email verification isn't a meaningful concept for them and they're excluded.
export default function EmailVerificationBanner() {
  const { user, isAuthenticated } = useAuthStore()
  const [dismissed, setDismissed] = useState(false)
  const [sending, setSending] = useState(false)

  const shouldShow = isAuthenticated && user && !user.isEmailVerified
    && (user.role === 'buyer' || user.role === 'seller') && !dismissed

  if (!shouldShow) return null

  const resend = async () => {
    setSending(true)
    try {
      await authAPI.resendVerification()
      toast.success('Verification email sent — check your inbox')
    } catch (err: any) {
      toast.error(err?.error || 'Failed to send verification email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex items-center justify-center gap-3 px-4 py-2.5 text-xs relative z-50" style={{ background: 'var(--grad)', color: '#fff' }}>
      <Mail size={13} className="flex-shrink-0" />
      <span>Please verify your email address to unlock all features.</span>
      <button onClick={resend} disabled={sending} className="font-bold underline underline-offset-2 disabled:opacity-60 flex items-center gap-1.5">
        {sending && <Loader2 size={11} className="animate-spin" />}
        Resend Email
      </button>
      <button onClick={() => setDismissed(true)} className="absolute right-4 top-1/2 -translate-y-1/2" aria-label="Dismiss">
        <X size={13} />
      </button>
    </div>
  )
}
