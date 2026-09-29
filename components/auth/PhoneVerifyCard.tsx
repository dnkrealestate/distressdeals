'use client'
import { useState } from 'react'
import { Phone, ShieldAlert, ShieldCheck, Loader2, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ConfirmationResult } from 'firebase/auth'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types'
import { firebasePhoneEnabled, sendPhoneCode, confirmPhoneCode, phoneAuthError, toE164, useResendCooldown } from '@/lib/firebase'

// "Your number isn't verified" → send an SMS code to the registered number (or a corrected one) → verified.
// Verifying a different number replaces the one on the account (the backend stores only the number Firebase proved).
// `becomeSeller` also switches a buyer to a seller account once the number is proven.
export default function PhoneVerifyCard({
  becomeSeller = false, title, subtitle, onVerified,
}: {
  becomeSeller?: boolean
  title?: string
  subtitle?: string
  onVerified?: (user: User) => void
}) {
  const { user, setUser } = useAuthStore()
  const [phone, setPhone] = useState(user?.phone || '')
  const [editing, setEditing] = useState(!user?.phone)
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null)
  const [sentTo, setSentTo] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [cooldown, startCooldown] = useResendCooldown()

  const e164 = toE164(phone)
  const codeSent = !!confirmation && sentTo === e164

  const send = async () => {
    if (!e164) { toast.error('Enter your mobile number with the country code, e.g. +971 50 123 4567'); return }
    if (cooldown > 0) return
    setBusy(true)
    try {
      if (firebasePhoneEnabled) {
        setConfirmation(await sendPhoneCode(e164, 'phone-verify-recaptcha'))
      } else {
        await authAPI.sendOtp(e164)
        setConfirmation({} as ConfirmationResult)   // WhatsApp fallback: the backend holds the code
      }
      setSentTo(e164); setCode(''); setEditing(false); startCooldown()
      toast.success(`Code sent to ${e164}`)
    } catch (err: any) {
      toast.error(firebasePhoneEnabled ? phoneAuthError(err) : (err?.error || 'Could not send the code'))
    } finally { setBusy(false) }
  }

  const verify = async () => {
    if (busy || code.length < 6 || !confirmation) return   // Enter + tap must not verify the same code twice
    setBusy(true)
    try {
      let res
      if (firebasePhoneEnabled) {
        let idToken: string
        try { idToken = await confirmPhoneCode(confirmation, code) }
        catch (err) { toast.error(phoneAuthError(err)); return }
        res = await authAPI.verifyPhoneFirebase(idToken, becomeSeller)
      } else {
        res = await authAPI.verifyOtp(code)
      }
      const updated: User | undefined = res.data?.data?.user
      if (updated) setUser(updated)
      toast.success(becomeSeller ? 'Number verified — your seller account is ready' : 'Number verified')
      if (updated) onVerified?.(updated)
    } catch (err: any) {
      toast.error(err?.error || 'Verification failed — please try again')
    } finally { setBusy(false) }
  }

  return (
    <div className="card p-5 sm:p-6" style={{ border: '1px solid rgba(203,1,1,0.25)', background: 'linear-gradient(135deg, rgba(203,1,1,0.06), transparent)' }}>
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.12)' }}>
          <ShieldAlert size={20} style={{ color: 'var(--teal)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold" style={{ color: 'var(--text)' }}>{title || 'Your number is not verified'}</h3>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {subtitle || 'Verify your mobile number to list properties and open your seller dashboard. We’ll text you a 6-digit code.'}
          </p>

          {/* Number: the registered one, editable */}
          <div className="mt-4 max-w-md">
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Mobile number</label>
            {editing ? (
              <div className="mt-1.5 flex flex-col sm:flex-row gap-2">
                <div className="input-glass flex items-center gap-2 h-11 px-3 rounded-xl flex-1 min-w-0">
                  <Phone size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                  <input value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                    inputMode="tel" placeholder="+971 50 123 4567" className="bg-transparent flex-1 text-sm outline-none min-w-0" style={{ color: 'var(--text)' }} />
                </div>
                <button onClick={send} disabled={busy || cooldown > 0 || !e164} className="btn-primary h-11 justify-center disabled:opacity-60 whitespace-nowrap">
                  {busy ? <Loader2 size={14} className="animate-spin" /> : cooldown > 0 ? `Wait ${cooldown}s` : 'Send OTP'}
                </button>
              </div>
            ) : (
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{e164 || phone}</span>
                <button onClick={() => setEditing(true)} className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: 'var(--teal)' }}>
                  <Pencil size={11} /> Change number
                </button>
                {!codeSent && (
                  <button onClick={send} disabled={busy || cooldown > 0} className="btn-primary btn-sm ml-auto disabled:opacity-60">
                    {busy ? <Loader2 size={13} className="animate-spin" /> : cooldown > 0 ? `Wait ${cooldown}s` : 'Send OTP'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Code */}
          {codeSent && !editing && (
            <div className="mt-4 max-w-md">
              <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-mid)' }}>
                <ShieldCheck size={13} style={{ color: '#16A34A' }} /> Enter the 6-digit code sent to <strong>{sentTo}</strong>
              </p>
              <div className="flex gap-2">
                <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} onKeyDown={e => e.key === 'Enter' && verify()}
                  inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" aria-label="Verification code"
                  className="input flex-1 min-w-0 tracking-[0.4em] text-center font-semibold" />
                <button onClick={verify} disabled={busy || code.length < 6} className="btn-primary btn-sm disabled:opacity-60 whitespace-nowrap">
                  {busy ? <Loader2 size={13} className="animate-spin" /> : 'Verify'}
                </button>
              </div>
              <button onClick={send} disabled={busy || cooldown > 0} className="text-xs mt-2 font-semibold disabled:opacity-60" style={{ color: 'var(--teal)' }}>
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          )}
          <div id="phone-verify-recaptcha" />
        </div>
      </div>
    </div>
  )
}
