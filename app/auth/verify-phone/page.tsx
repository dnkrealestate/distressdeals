'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MessageSquare, CheckCircle2, Loader2 } from 'lucide-react'
import type { ConfirmationResult } from 'firebase/auth'
import { firebasePhoneEnabled, sendPhoneCode, confirmPhoneCode, phoneAuthError, toE164, useResendCooldown } from '@/lib/firebase'

// Opened by the mobile app inside a WebView (or an iframe on Expo web) to verify a phone number with Firebase SMS.
// Firebase's web phone sign-in needs a browser for its reCAPTCHA, which is why this lives on the site. The page only
// proves the number: it posts the Firebase ID token back to the app, and the app sends it to our backend with the
// user's own login (/auth/verify-phone-firebase). Nothing here signs anyone in.
//
// Query: ?phone=+971501234567&theme=dark

type Msg = { type: 'firebase-phone-token'; idToken: string } | { type: 'firebase-phone-cancel' } | { type: 'firebase-phone-error'; message: string }

function postToApp(msg: Msg) {
  const w = window as any
  if (w.ReactNativeWebView) { w.ReactNativeWebView.postMessage(JSON.stringify(msg)); return }
  // Expo web (dev only) embeds this page in an iframe: answer only a local parent, never an arbitrary site.
  if (window.parent !== window && document.referrer) {
    try {
      const origin = new URL(document.referrer).origin
      if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) window.parent.postMessage(msg, origin)
    } catch { /* bad referrer — nothing to answer */ }
  }
}

function VerifyPhone() {
  const params = useSearchParams()
  const phone = toE164(params.get('phone') || '')
  const dark = params.get('theme') === 'dark'

  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null)
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, startCooldown] = useResendCooldown()

  // Match the app's theme. The site's own theme handling runs after this and would reset it, so hold the attribute
  // here without touching the visitor's saved choice.
  useEffect(() => {
    const el = document.documentElement
    const want = dark ? 'dark' : 'light'
    const apply = () => { if (el.getAttribute('data-theme') !== want) el.setAttribute('data-theme', want) }
    apply()
    const mo = new MutationObserver(apply)
    mo.observe(el, { attributes: true, attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  }, [dark])

  const send = async () => {
    if (cooldown > 0) return
    setError(''); setSending(true)
    try { setConfirmation(await sendPhoneCode(phone, 'verify-recaptcha')); setCode(''); startCooldown() }
    catch (err) { setError(phoneAuthError(err)) }
    finally { setSending(false) }
  }

  const verify = async () => {
    if (!confirmation || code.length < 6) return
    setError(''); setVerifying(true)
    try {
      const idToken = await confirmPhoneCode(confirmation, code)
      setDone(true)
      postToApp({ type: 'firebase-phone-token', idToken })
    } catch (err) { setError(phoneAuthError(err)) }
    finally { setVerifying(false) }
  }

  if (!firebasePhoneEnabled || !phone) {
    return <Shell><p className="text-sm text-center" style={{ color: 'var(--text-mid)' }}>{!phone ? 'No phone number was given.' : 'SMS verification is not available right now.'}</p></Shell>
  }

  return (
    <Shell>
      {/* Invisible reCAPTCHA renders here — kept outside the conditional UI so it survives every state. */}
      <div id="verify-recaptcha" />
      {done ? (
        <div className="text-center">
          <CheckCircle2 size={40} className="mx-auto mb-3" style={{ color: 'var(--green)' }} />
          <p className="font-semibold" style={{ color: 'var(--text)' }}>Number verified</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Finishing up…</p>
        </div>
      ) : (
        <>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(203,1,1,0.10)' }}>
            <MessageSquare size={24} style={{ color: 'var(--teal)' }} />
          </div>
          <h1 className="text-xl font-bold text-center" style={{ color: 'var(--text)' }}>Verify your number</h1>
          <p className="text-sm text-center mt-1" style={{ color: 'var(--text-muted)' }}>
            {confirmation ? 'Enter the 6-digit code we texted to' : 'We’ll text a 6-digit code to'}
          </p>
          <p className="text-center font-semibold mb-6" style={{ color: 'var(--teal)' }}>{phone}</p>

          {confirmation && (
            <input
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && verify()}
              inputMode="numeric" autoComplete="one-time-code" autoFocus placeholder="••••••"
              className="w-full h-14 rounded-xl text-center text-2xl font-bold tracking-[0.5em] outline-none mb-4"
              style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          )}

          {error && <p className="text-xs text-center mb-3" style={{ color: '#FB7185' }}>{error}</p>}

          {confirmation ? (
            <button onClick={verify} disabled={verifying || code.length < 6} className="btn-primary w-full h-12 justify-center disabled:opacity-60">
              {verifying ? <Loader2 size={16} className="animate-spin" /> : 'Verify code'}
            </button>
          ) : null}
          <button onClick={send} disabled={sending || cooldown > 0}
            className={confirmation ? 'w-full mt-3 text-sm font-semibold disabled:opacity-60' : 'btn-primary w-full h-12 justify-center disabled:opacity-60'}
            style={confirmation ? { color: 'var(--teal)' } : undefined}>
            {sending ? <Loader2 size={16} className="animate-spin mx-auto" /> : confirmation ? (cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code') : 'Send code'}
          </button>
          <button onClick={() => postToApp({ type: 'firebase-phone-cancel' })} className="w-full mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            Use a different number
          </button>
        </>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}

export default function VerifyPhonePage() {
  return <Suspense><VerifyPhone /></Suspense>
}
