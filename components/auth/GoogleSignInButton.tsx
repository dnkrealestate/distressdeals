'use client'
import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { GoogleIcon } from './SocialIcons'
import toast from 'react-hot-toast'

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

declare global {
  interface Window { google?: any }
}

// Real Google Identity Services integration. Renders Google's own button
// (the supported, non-deprecated flow) once the SDK loads and a real OAuth
// Client ID is configured. Without one, falls back to the old stub button so
// the page doesn't shift layout — clicking it is honest about why it can't
// work yet, rather than pretending to sign in.
//
// Google's rendered button can't be pixel-matched to our own (fixed corner
// radius, fixed height presets) — but it CAN be told to use a dark-mode-
// appropriate theme, and centered in a wrapper the same height as the rest
// of the form so it doesn't look visually broken next to our custom inputs.
export default function GoogleSignInButton({ onAuthenticated, role }: { onAuthenticated: () => void; role?: 'buyer' | 'seller' }) {
  const googleLogin = useAuthStore(s => s.googleLogin)
  const { dark } = useThemeStore()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!scriptLoaded || !CLIENT_ID || !window.google || !buttonRef.current || !wrapperRef.current) return

    const handleCredential = async (response: { credential: string }) => {
      setBusy(true)
      try {
        await googleLogin(response.credential, role)
        toast.success('Signed in with Google')
        onAuthenticated()
      } catch (err: any) {
        toast.error(err?.error || 'Google sign-in failed')
      } finally {
        setBusy(false)
      }
    }

    window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: handleCredential })
    buttonRef.current.innerHTML = '' // clear any previous render before re-rendering (e.g. on theme toggle)
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: dark ? 'filled_black' : 'outline',
      size: 'large',
      shape: 'rectangular',
      width: wrapperRef.current.clientWidth,
      text: 'continue_with',
    })
  }, [scriptLoaded, dark, role, googleLogin, onAuthenticated])

  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        onClick={() => toast("Google sign-in isn't configured yet. Please use email for now.", { icon: '🔑' })}
        className="flex items-center justify-center gap-3 h-12 rounded-xl border text-sm font-medium transition-all"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
      >
        <GoogleIcon /> Continue with Google
      </button>
    )
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setScriptLoaded(true)} />
      <div ref={wrapperRef} className="w-full h-12 flex items-center justify-center overflow-hidden rounded-xl">
        <div ref={buttonRef} className={busy ? 'opacity-60 pointer-events-none' : ''} />
      </div>
    </>
  )
}
