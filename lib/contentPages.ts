import { contentPageAPI } from './api'
import type { ContentPageData } from '@/types'

// Fetches this page's admin-editable body content (see app/admin/(dashboard)/settings/content/[pageKey]) and
// falls back to the page's own hardcoded default if nothing has been saved yet (or the request fails) — mirrors
// the homepage's FALLBACK_CONTENT pattern, so a page is never blank just because no one has edited it.
export async function getContentPage(pageKey: string, fallback: ContentPageData): Promise<ContentPageData> {
  try {
    const res = await contentPageAPI.get(pageKey)
    return res.data.success && res.data.data ? res.data.data : fallback
  } catch {
    return fallback
  }
}
