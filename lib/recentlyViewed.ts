'use client'
import { useEffect, useState } from 'react'

// "Recently viewed" — properties AND new projects this visitor opened, kept on this device (like browser history,
// not tied to an account). Stores a snapshot at view time so the sidebar renders instantly with no extra fetch;
// price/image may go slightly stale if the listing changes later, which is fine for a "what did I just look at" list.

const STORAGE_KEY = 'dd_recently_viewed'
const CHANGE_EVENT = 'dd-recently-viewed'
const MAX_ITEMS = 12

export interface RecentlyViewedItem {
  kind?: 'property' | 'project' // older entries (before projects were tracked) are properties
  slug: string
  title: string
  image?: string
  price: number
  area?: string
  listingType: 'sale' | 'rent'
  viewedAt: number
}

const keyOf = (i: Pick<RecentlyViewedItem, 'kind' | 'slug'>) => `${i.kind || 'property'}:${i.slug}`

export const recentlyViewedHref = (i: Pick<RecentlyViewedItem, 'kind' | 'slug'>) =>
  i.kind === 'project' ? `/projects/${i.slug}` : `/buyer/properties/${i.slug}`

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.filter(i => i && i.slug && i.title) : []
  } catch {
    return []
  }
}

function save(list: RecentlyViewedItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new Event(CHANGE_EVENT)) // this tab's sidebars refresh (other tabs get the 'storage' event)
  } catch {
    // localStorage can throw in private-browsing/quota-exceeded contexts — not worth surfacing
  }
}

export function addRecentlyViewed(item: Omit<RecentlyViewedItem, 'viewedAt'>) {
  if (typeof window === 'undefined' || !item.slug) return
  const existing = getRecentlyViewed().filter(i => keyOf(i) !== keyOf(item))
  save([{ ...item, viewedAt: Date.now() }, ...existing].slice(0, MAX_ITEMS))
}

export function clearRecentlyViewed() {
  if (typeof window === 'undefined') return
  save([])
}

// Live list — updates when something is viewed or cleared, in this tab or another one. `null` until read.
export function useRecentlyViewed(): RecentlyViewedItem[] | null {
  const [items, setItems] = useState<RecentlyViewedItem[] | null>(null)
  useEffect(() => {
    const read = () => setItems(getRecentlyViewed())
    read()
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) read() }
    window.addEventListener(CHANGE_EVENT, read)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener(CHANGE_EVENT, read); window.removeEventListener('storage', onStorage) }
  }, [])
  return items
}
