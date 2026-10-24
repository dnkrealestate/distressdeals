import type { Project } from '@/types'

// A server page that renders project cards hands each record to the card (a client component), and every field of
// it is embedded in the page's HTML. The cards don't show descriptions, floor plans, landmarks, videos or SEO fields —
// leaving them out keeps area / developer / list pages several hundred KB lighter.
const NOT_ON_CARDS = ['description', 'amenities', 'floorPlans', 'landmarks', 'videos', 'viewsByCountry', 'seoKeywords', 'metaTitle', 'metaDescription', 'focusKeyword', 'tagsAdded', 'tagsRemoved', '__v'] as const

export function projectForCard<T extends Partial<Project>>(p: T): T {
  const o: any = { ...p }
  for (const k of NOT_ON_CARDS) delete o[k]
  return o
}
