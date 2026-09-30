'use client'
import { useEffect, useState } from 'react'
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, signOut, type Auth, type ConfirmationResult } from 'firebase/auth'

// Firebase Auth is used only to text a one-time code to a phone number and prove the person owns it. We never keep
// the Firebase session: the ID token goes to our backend (/auth/verify-phone-firebase), then we sign out of Firebase.
// These values come from Firebase console → Project settings → Your apps → Web app. None of them are secret.
const config = {
  apiKey:     process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'distress-deals-uae-7d6b5.firebaseapp.com',
  projectId:  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'distress-deals-uae-7d6b5',
  appId:      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Phone numbers are verified only by Firebase SMS; without a web API key verification is unavailable.
export const firebasePhoneEnabled = !!config.apiKey

let app: FirebaseApp | null = null
function auth(): Auth {
  app ??= getApps()[0] ?? initializeApp(config)
  const a = getAuth(app)
  a.useDeviceLanguage()
  return a
}

let verifier: RecaptchaVerifier | null = null

/**
 * Sends the SMS code. `containerId` is an empty element the invisible reCAPTCHA renders into — not a button, or the
 * widget would also fire on the button's own click.
 *
 * Every send gets a brand-new reCAPTCHA: a token Google has already accepted once is rejected on the next request
 * (auth/invalid-app-credential), which is what broke resends and retries.
 */
export async function sendPhoneCode(phoneE164: string, containerId: string): Promise<ConfirmationResult> {
  const a = auth()
  const container = document.getElementById(containerId)
  if (!container) throw Object.assign(new Error('reCAPTCHA container missing'), { code: 'auth/captcha-check-failed' })
  try { verifier?.clear() } catch { /* already gone */ }
  container.innerHTML = ''
  const box = document.createElement('div')
  container.appendChild(box)
  verifier = new RecaptchaVerifier(a, box, { size: 'invisible' })
  // End the previous verification's Firebase session here (not right after confirming), so a repeated "Verify"
  // tap on the last code can still reuse it — see confirmPhoneCode.
  await signOut(a).catch(() => {})
  return signInWithPhoneNumber(a, phoneE164, verifier)
}

// One confirm per sent code: a second tap on Verify (or Enter + tap) gets the first attempt's result instead of
// asking Firebase again — Firebase answers a repeat of an already-used code with "code-expired".
const confirming = new WeakMap<ConfirmationResult, Promise<string>>()

/** Confirms the code and returns the Firebase ID token for our backend. */
export function confirmPhoneCode(confirmation: ConfirmationResult, code: string): Promise<string> {
  const pending = confirming.get(confirmation)
  if (pending) return pending
  const run = (async () => {
    try {
      const cred = await confirmation.confirm(code)
      return await cred.user.getIdToken()
    } catch (err: any) {
      // Firebase already accepted this number (an earlier attempt went through) — use that instead of an error.
      const current = auth().currentUser
      if (current?.phoneNumber && String(err?.code || '').includes('code-expired')) return current.getIdToken()
      confirming.delete(confirmation)   // a genuinely wrong code may be retried with the right one
      throw err
    }
  })()
  confirming.set(confirmation, run)
  return run
}

/** Friendly text for the Firebase error codes people actually hit. */
export function phoneAuthError(err: any): string {
  const code: string = err?.code || ''
  // Keep the real reason in the console — the friendly text below hides it.
  console.error('[firebase phone auth]', code, err?.message, err?.customData)
  // Firebase's SMS region policy blocks this country (Authentication → Settings → SMS region policy).
  if (code.includes('operation-not-allowed') && /region/i.test(err?.message || '')) return 'We can’t send SMS codes to this country yet — please contact us'
  if (code.includes('operation-not-allowed')) return 'SMS sign-in is not enabled yet (Firebase → Authentication → Sign-in method → Phone)'
  if (code.includes('billing-not-enabled'))   return 'SMS needs the Firebase Blaze plan — upgrade the project billing'
  if (code.includes('unauthorized-domain'))   return 'This website domain is not authorized in Firebase (Authentication → Settings → Authorized domains)'
  if (code.includes('api-key') || code.includes('app-not-authorized')) return 'The Firebase web API key is blocked for this site — check its restrictions in Google Cloud'
  if (code.includes('internal-error'))        return 'Firebase refused the request (internal-error) — check the Firebase setup'
  if (code.includes('invalid-phone-number')) return 'That phone number doesn’t look right — include the country code, e.g. +971 50 123 4567'
  if (code.includes('too-many-requests'))    return 'Too many code requests for this number or network — SMS is paused for a while. Please try again later (usually within an hour).'
  if (code.includes('invalid-verification-code')) return 'That code is not right'
  // Firebase's own rule (not ours): a code stops working once a newer one is sent, or after a while.
  if (code.includes('code-expired'))         return 'That code is no longer valid — use the latest SMS, or tap Resend code'
  if (code.includes('quota-exceeded'))       return 'SMS limit reached for today — please try again later'
  if (code.includes('captcha'))              return 'Security check failed — please refresh the page and try again'
  return `We couldn’t send the code — please try again${code ? ` (${code.replace('auth/', '')})` : ''}`
}

/**
 * Seconds until another code may be sent. Every send counts toward Firebase's per-number and per-network limits,
 * and hitting them blocks SMS for a while ("too many attempts") — so resends wait out a short countdown.
 */
export const RESEND_WAIT_SECONDS = 60
export function useResendCooldown(): [number, () => void] {
  const [left, setLeft] = useState(0)
  useEffect(() => {
    if (left <= 0) return
    const t = setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left])
  return [left, () => setLeft(RESEND_WAIT_SECONDS)]
}

/** "0501234567" / "+971 50…" → "+971501234567" (UAE-first, same rules as the backend). */
export function toE164(raw: string): string {
  const hasPlus = raw.trim().startsWith('+')
  let d = raw.replace(/\D/g, '')
  if (!hasPlus && d.startsWith('00')) d = d.slice(2)
  else if (!hasPlus && d.startsWith('0') && d.length === 10) d = '971' + d.slice(1)
  else if (!hasPlus && d.length === 9 && d.startsWith('5')) d = '971' + d
  return d ? '+' + d : ''
}
