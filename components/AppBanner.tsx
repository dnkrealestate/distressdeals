'use client'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { track } from '@vercel/analytics'
import { PLAY_STORE_URL, APP_BANNER_HIDE_KEY, APP_BANNER_HIDE_DAYS } from '@/lib/appBanner'

// Slim "Get our Android app" bar pinned to the top on Android phones (see lib/appBanner.ts). Always in the HTML but
// hidden by CSS unless html[data-app-banner="show"] — set before the first paint, so showing it never moves the page.
// A small banner like this is what Google recommends instead of a full-screen app pop-up.
type RelatedApp = { platform: string; id?: string }

function hide(days = APP_BANNER_HIDE_DAYS) {
  try { localStorage.setItem(APP_BANNER_HIDE_KEY, String(Date.now() + days * 864e5)) } catch { /* private mode */ }
  document.documentElement.removeAttribute('data-app-banner')
}

export default function AppBanner() {
  useEffect(() => {
    if (document.documentElement.getAttribute('data-app-banner') !== 'show') return
    // Chrome on Android can tell whether our app is installed (web manifest related_applications + the app's
    // asset_statements). Installed → no bar, and no check again for a while.
    const nav = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<RelatedApp[]> }
    nav.getInstalledRelatedApps?.()
      .then(apps => { if (apps.some(a => a.platform === 'play')) hide() })
      .catch(() => {})
  }, [])

  return (
    <div className="app-banner" role="region" aria-label="Get the Distress Deals UAE app" data-nosnippet>
      <button type="button" className="app-banner-close" aria-label="Close" onClick={() => { track('App banner closed'); hide() }}>
        <X size={15} strokeWidth={2.4} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element -- 4 KB icon, shown only on Android after the boot check */}
      <img src="/app-icon-96.png" alt="" width={36} height={36} className="app-banner-icon" loading="lazy" decoding="async" />
      <div className="app-banner-text">
        <p className="app-banner-title">Distress Deals UAE</p>
        <p className="app-banner-sub">Faster in our free app · Google Play</p>
      </div>
      <a
        href={PLAY_STORE_URL}
        className="app-banner-cta"
        rel="noopener"
        onClick={() => { track('App banner — Get app clicked', { page: window.location.pathname }); hide(7) }}
      >
        Get app
      </a>
    </div>
  )
}
