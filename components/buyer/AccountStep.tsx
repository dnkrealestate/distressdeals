'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Lock, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export interface LeadAccountMeta {
  accountCreated?: boolean
  matched?: boolean
  needsPassword?: boolean
  claimToken?: string
}

// Shown right after a guest submits an "I'm interested" form — gets them straight into their account instead of
// leaving them to find their own way back in later.
//   needsPassword → new (or never-claimed) account: pick a password, then they're signed in immediately.
//   matched only  → the account already has a password: enter it and log straight in.
//   neither       → no account was resolved for this submission (e.g. a staff number) — nothing to show.
export default function AccountStep({ meta, email, onDone }: { meta: LeadAccountMeta; email: string; onDone: () => void }) {
  const claimAccount = useAuthStore(s => s.claimAccount)
  const login = useAuthStore(s => s.login)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!meta.matched) return null

  async function setPasswordAndEnter() {
    if (password.length < 6) { setError('Use at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords don’t match'); return }
    setError(''); setBusy(true)
    try {
      await claimAccount(meta.claimToken as string, password)
      setDone(true)
    } catch (err: any) {
      setError(err?.error || err?.response?.data?.error || 'That link has expired — please submit your interest again')
    } finally { setBusy(false) }
  }

  async function logIn() {
    if (!password) { setError('Enter your password'); return }
    setError(''); setBusy(true)
    try {
      await login(email, password)
      setDone(true)
    } catch (err: any) {
      setError(err?.error || err?.response?.data?.error || 'That password isn’t right')
    } finally { setBusy(false) }
  }

  if (done) {
    return (
      <div className="mt-4 rounded-xl p-4 text-center" style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)' }}>
        <CheckCircle2 size={20} className="mx-auto mb-1.5" style={{ color: '#16A34A' }} />
        <p className="text-xs font-medium mb-2.5" style={{ color: 'var(--text)' }}>You're in! Explore your account for easier property finding.</p>
        <Link href="/buyer/profile" className="btn-primary btn-sm" onClick={onDone}>Go to my account <ArrowRight size={12} /></Link>
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-xl p-4 text-left" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
      {meta.needsPassword ? (
        <>
          <p className="text-xs font-medium mb-0.5 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
            <Lock size={12} style={{ color: 'var(--teal)' }} /> Set a password to continue
          </p>
          <p className="text-[11px] mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            We've set up an account for you with this number and email — choose a password so you can explore it and track your enquiries easily.
          </p>
          <div className="space-y-2">
            <input type="password" className="input text-sm py-2" placeholder="Choose a password" value={password} onChange={e => setPassword(e.target.value)} />
            <input type="password" className="input text-sm py-2" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && setPasswordAndEnter()} />
          </div>
          {error && <p className="text-[11px] mt-1.5" style={{ color: '#FB7185' }}>{error}</p>}
          <button onClick={setPasswordAndEnter} disabled={busy} className="btn-primary btn-sm w-full mt-3">
            {busy ? <Loader2 size={13} className="animate-spin" /> : 'Continue'}
          </button>
        </>
      ) : (
        <>
          <p className="text-xs font-medium mb-0.5 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
            <ShieldCheck size={12} style={{ color: '#16A34A' }} /> This number is already registered
          </p>
          <p className="text-[11px] mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Enter your password to log in — it makes exploring your account and finding your next property much easier.
          </p>
          <input type="password" className="input text-sm py-2" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && logIn()} />
          {error && <p className="text-[11px] mt-1.5" style={{ color: '#FB7185' }}>{error}</p>}
          <div className="flex items-center gap-2 mt-3">
            <button onClick={logIn} disabled={busy} className="btn-primary btn-sm flex-1">
              {busy ? <Loader2 size={13} className="animate-spin" /> : 'Log in'}
            </button>
            <Link href="/auth/forgot-password" className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Forgot password?</Link>
          </div>
        </>
      )}
    </div>
  )
}
