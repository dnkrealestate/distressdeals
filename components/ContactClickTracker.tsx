'use client'
import { useEffect } from 'react'
import { trackLead } from '@/lib/leadTracking'
import { useAuthStore } from '@/store/authStore'

// Every "Call" (tel:) and "WhatsApp" (wa.me / api.whatsapp.com) link on the site, tracked as a Vercel event from one
// place — so buttons added later are covered automatically. Mounted once in the root layout.
// e.g. "WhatsApp button clicked /projects/binghatti-skyflame-1"  { track: "name: …, phone: …, email: …, button: …, Page :…" }
export default function ContactClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a) return
      const href = a.getAttribute('href') || ''
      const kind = href.startsWith('tel:') ? 'Call' : /(^|\/\/)(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(href) ? 'WhatsApp' : null
      if (!kind) return
      // Signed-in visitors: who clicked. Anonymous: blank (the click still counts).
      const user = useAuthStore.getState().user
      const label = (a.getAttribute('aria-label') || a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)
      trackLead(`${kind} button clicked`, {
        name: user?.name, phone: user?.phone, email: user?.email,
        extra: { button: label || kind, to: kind === 'Call' ? href.slice(4) : href.split('?')[0].replace(/^https?:\/\//, '') },
      })
    }
    // Capture phase: fires even when a component stops the click from bubbling.
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])
  return null
}
