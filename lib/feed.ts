'use client'
// Behaviour tracking for the personalised For Sale feed (backend services/feed). Anonymous: a random browser id
// (lib/visitor.ts, also kept in a first-party cookie) — no names, numbers or e-mails are ever sent. Events are queued
// and sent in small batches (and on leaving the page), so tracking never slows the page down.
import { getVisitorId } from '@/lib/visitor'
import { API_BASE_URL } from '@/lib/api'

export type FeedEventType =
  | 'impression' | 'property_click' | 'property_view' | 'time_on_property' | 'scroll_depth'
  | 'property_save' | 'property_unsave' | 'property_compare' | 'not_interested'
  | 'enquiry_started' | 'viewing_requested' | 'whatsapp_clicked' | 'phone_clicked'
  | 'search' | 'filter_applied' | 'area_selected' | 'price_filter' | 'bedroom_filter' | 'property_type_selected'

export interface FeedEvent { type: FeedEventType; itemId?: string; itemKind?: 'property' | 'project'; src?: string; position?: number; value?: number; filters?: Record<string, any> }

let queue: FeedEvent[] = []
let timer: ReturnType<typeof setTimeout> | null = null
let variants: Record<string, string> = {}
export const setFeedVariants = (v: Record<string, string> | undefined) => { if (v) variants = { ...variants, ...v } }

// The browser id, also as a first-party cookie (a year), so it survives as one visitor across pages.
export function feedVisitorId(): string {
  const id = getVisitorId()
  if (id && typeof document !== 'undefined' && !document.cookie.includes(`dd_vid=${id}`)) {
    document.cookie = `dd_vid=${id}; path=/; max-age=${365 * 24 * 3600}; SameSite=Lax`
  }
  return id
}

function flush(useBeacon = false) {
  if (timer) { clearTimeout(timer); timer = null }
  if (!queue.length) return
  const visitorId = feedVisitorId()
  if (!visitorId) { queue = []; return }
  const batch = queue.splice(0, 50)
  const body = JSON.stringify({ visitorId, events: batch, variants })
  const url = `${API_BASE_URL}/feed/events`
  try {
    if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }))     // a beacon cannot send JSON across origins
    } else {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('luxestate_token') : null
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body, keepalive: true }).catch(() => {})
    }
  } catch { /* tracking must never break the page */ }
  if (queue.length) flush(useBeacon)
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => flush(true))
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(true) })
}

export function trackFeed(e: FeedEvent) {
  if (typeof window === 'undefined') return
  queue.push(e)
  if (queue.length >= 20) flush()
  else if (!timer) timer = setTimeout(() => flush(), 4000)
}

// Cards already counted as seen on this page view — an impression is counted once per card per page.
const seen = new Set<string>()
export function trackImpressionOnce(e: FeedEvent) {
  const k = `${e.itemKind}:${e.itemId}:${e.src || ''}`
  if (seen.has(k)) return
  seen.add(k)
  trackFeed({ ...e, type: 'impression' })
}
