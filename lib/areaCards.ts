import type { AreaStats } from '@/types'

// The /areas list: every area with a page (listing stats from GET /properties/areas) plus its guide's photo and
// featured flag (GET /area-content). Shared by the server page and the list component.
export type AreaCardData = AreaStats & { heroImage?: string; isFeatured?: boolean }

export function mergeAreaCards(stats: AreaStats[], guides: any[]): AreaCardData[] {
  const guideByArea = new Map((guides || []).map((c: any) => [c.area, c]))
  const merged = (stats || []).map(a => {
    const c = guideByArea.get(a.area) as any
    return { ...a, heroImage: c?.heroImage, isFeatured: c?.isFeatured }
  })
  return merged.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
}
