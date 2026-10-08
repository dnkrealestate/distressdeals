'use client'
import { useEffect, useRef } from 'react'
import { trackFeed, trackImpressionOnce } from '@/lib/feed'

// Wraps one card in the feed or a recommendation row: counts it as seen when at least half of it has been on screen
// for 0.6 s (once per page view), and records the click when it is opened. `src` says where the card came from
// ("rel", "discovery", "section:recommended"…) — what recommendation performance is measured on.
export default function FeedTracked({ kind, id, src, position, children, className }: {
  kind: 'property' | 'project'; id?: string; src?: string; position?: number; children: React.ReactNode; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !id || typeof IntersectionObserver === 'undefined') return
    let t: ReturnType<typeof setTimeout> | null = null
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        if (!t) t = setTimeout(() => { trackImpressionOnce({ type: 'impression', itemId: id, itemKind: kind, src, position }); io.disconnect() }, 600)
      } else if (t) { clearTimeout(t); t = null }
    }, { threshold: [0, 0.5, 1] })
    io.observe(el)
    return () => { io.disconnect(); if (t) clearTimeout(t) }
  }, [id, kind, src, position])
  return (
    <div ref={ref} className={className}
      onClickCapture={e => {
        if (!id) return
        // Save / compare / interested buttons inside the card are their own events, not "opened the listing".
        const target = e.target as HTMLElement
        if (target.closest('button')) return
        trackFeed({ type: 'property_click', itemId: id, itemKind: kind, src, position })
      }}>
      {children}
    </div>
  )
}
