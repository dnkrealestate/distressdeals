'use client'
import { useEffect } from 'react'
import { trackFeed } from '@/lib/feed'

// On a property / project page: records the view, how long it was actually looked at (only while the tab is visible),
// how far down it was read, and taps on the WhatsApp / call buttons — the strongest signals the feed learns from.
export function useItemTracking(kind: 'property' | 'project', id?: string) {
  useEffect(() => {
    if (!id) return
    trackFeed({ type: 'property_view', itemId: id, itemKind: kind })
    let visibleSince: number | null = document.visibilityState === 'visible' ? Date.now() : null
    let total = 0, maxDepth = 0, sent = false
    const onVisibility = () => {
      if (document.visibilityState === 'visible') visibleSince = Date.now()
      else if (visibleSince) { total += Date.now() - visibleSince; visibleSince = null; send() }
    }
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      if (h > 0) maxDepth = Math.max(maxDepth, Math.round((window.scrollY / h) * 100))
    }
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a') as HTMLAnchorElement | null
      if (!a) return
      const href = a.getAttribute('href') || ''
      if (/wa\.me|whatsapp/i.test(href)) trackFeed({ type: 'whatsapp_clicked', itemId: id, itemKind: kind })
      else if (/^tel:/i.test(href)) trackFeed({ type: 'phone_clicked', itemId: id, itemKind: kind })
    }
    // Sent once, when the visitor leaves (or hides the tab for the first time) — the page is then likely done with.
    function send() {
      if (sent) return
      const seconds = Math.round((total + (visibleSince ? Date.now() - visibleSince : 0)) / 1000)
      if (seconds <= 0) return
      sent = true
      trackFeed({ type: 'time_on_property', itemId: id, itemKind: kind, value: seconds })
      if (maxDepth > 0) trackFeed({ type: 'scroll_depth', itemId: id, itemKind: kind, value: maxDepth })
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('click', onClick, true)
      send()
    }
  }, [kind, id])
}
