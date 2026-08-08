'use client'
import { useEffect, useState } from 'react'
import Script from 'next/script'
import { useAuthStore } from '@/store/authStore'
import { FacebookIcon } from './SocialIcons'
import toast from 'react-hot-toast'

const APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID

declare global {
  interface Window { FB?: any; fbAsyncInit?: () => void }
}

// Classic FB.login() popup flow — still the standard, fully-supported way to
// do Facebook Login (unlike Google, Facebook hasn't deprecated this in favor
// of a rendered-button-only flow). The access token it returns is verified
// server-side against this app's ID before being trusted.
export default function FacebookSignInButton({ onAuthenticated, role }: { onAuthenticated: () => void; role?: 'buyer' | 'seller' }) {
  const facebookLogin = useAuthStore(s => s.facebookLogin)
  const [sdkReady, setSdkReady] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!APP_ID) return
    window.fbAsyncInit = () => {
      window.FB.init({ appId: APP_ID, cookie: true, xfbml: false, version: 'v21.0' })
      setSdkReady(true)
    }
  }, [])

  if (!APP_ID) {
    return (
      <button
        type="button"
        onClick={() => toast("Facebook sign-in isn't configured yet. Please use email for now.", { icon: '🔑' })}
        className="flex items-center justify-center gap-3 h-12 rounded-xl border text-sm font-medium transition-all"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
      >
        <FacebookIcon /> Continue with Facebook
      </button>
    )
  }

  const handleLogin = () => {
    if (!sdkReady || !window.FB) { toast.error('Facebook SDK is still loading — try again in a moment'); return }
    setBusy(true)
    window.FB.login((response: any) => {
      const accessToken = response?.authResponse?.accessToken
      if (!accessToken) { setBusy(false); toast('Facebook sign-in was cancelled', { icon: 'ℹ️' }); return }

      facebookLogin(accessToken, role)
        .then(() => { toast.success('Signed in with Facebook'); onAuthenticated() })
        .catch((err: any) => toast.error(err?.error || 'Facebook sign-in failed'))
        .finally(() => setBusy(false))
    }, { scope: 'email' })
  }

  return (
    <>
      <Script src="https://connect.facebook.net/en_US/sdk.js" strategy="afterInteractive" />
      <button
        type="button"
        onClick={handleLogin}
        disabled={busy}
        className="flex items-center justify-center gap-3 h-12 rounded-xl border text-sm font-medium transition-all disabled:opacity-60"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(49,178,222,0.40)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
      >
        <FacebookIcon /> Continue with Facebook
      </button>
    </>
  )
}
