// Lightweight recently-viewed tracking — no backend needed, per the strategy
// doc's own call-out ("trivial to add via localStorage + trackView, already
// called on PDP load"). Stores a denormalized snapshot at view-time rather
// than just an id, so the sidebar renders instantly with no extra fetch —
// price/image may go slightly stale if the listing changes later, which is
// an acceptable tradeoff for a "what did I just look at" widget.

const STORAGE_KEY = 'dd_recently_viewed'
const MAX_ITEMS = 12

export interface RecentlyViewedItem {
  slug: string
  title: string
  image?: string
  price: number
  area?: string
  listingType: 'sale' | 'rent'
  viewedAt: number
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addRecentlyViewed(item: Omit<RecentlyViewedItem, 'viewedAt'>) {
  if (typeof window === 'undefined') return
  try {
    const existing = getRecentlyViewed().filter(i => i.slug !== item.slug)
    const updated = [{ ...item, viewedAt: Date.now() }, ...existing].slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // localStorage can throw in private-browsing/quota-exceeded contexts — not worth surfacing
  }
}
