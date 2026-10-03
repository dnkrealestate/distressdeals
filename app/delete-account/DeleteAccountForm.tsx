'use client'
import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { userAPI } from '@/lib/api'
import { useAuthStore, useAuthHydrated } from '@/store/authStore'
import { STAFF_ROLES } from '@/lib/modules'

// The signed-in half of the delete-account page: type DELETE (and the password, when the account has one).
export default function DeleteAccountForm() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const hydrated = useAuthHydrated()
  const [confirm, setConfirm] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  if (!hydrated) return null
  if (done) {
    return <div className="card p-6 mt-8"><p className="font-semibold" style={{ color: 'var(--text)' }}>Your account has been deleted.</p><p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your personal details have been removed and you have been signed out.</p></div>
  }
  if (!isAuthenticated || !user) {
    return (
      <div className="card p-6 mt-8 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm" style={{ color: 'var(--text-mid)' }}>Sign in to delete your account here.</p>
        <Link href="/auth/login?next=/delete-account" className="btn-primary h-10 px-5 text-sm">Sign in</Link>
      </div>
    )
  }
  if (STAFF_ROLES.includes(user.role)) {
    return <div className="card p-6 mt-8"><p className="text-sm" style={{ color: 'var(--text-mid)' }}>Staff accounts are removed by an administrator.</p></div>
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!window.confirm('Delete your account for good? This cannot be undone.')) return
    setBusy(true)
    try {
      await userAPI.deleteAccount({ confirm: 'DELETE', password: password || undefined })
      setDone(true)
      logout()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.error || 'Could not delete the account — please try again')
    } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="card p-6 mt-8 space-y-4" style={{ borderColor: 'rgba(244,63,94,0.4)' }}>
      <div>
        <p className="font-semibold" style={{ color: 'var(--text)' }}>Delete the account for {user.email}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>This is permanent.</p>
      </div>
      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Type DELETE to confirm</label>
        <input className="input" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="DELETE" autoComplete="off" />
      </div>
      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Your password <span style={{ color: 'var(--text-muted)' }}>(leave empty if you sign in with a phone code, Google or Facebook)</span></label>
        <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
      </div>
      <button type="submit" disabled={busy || confirm.trim().toUpperCase() !== 'DELETE'} className="btn-primary h-11 px-6 text-sm disabled:opacity-50" style={{ background: '#E11D48' }}>
        {busy ? <Loader2 size={15} className="animate-spin" /> : 'Delete my account'}
      </button>
    </form>
  )
}
