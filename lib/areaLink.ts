import { propertyAPI } from '@/lib/api'

// An area's page address (/areas/[slug]) — the area name with dashes, as the backend's slugifyArea builds it.
export const areaSlug = (area: string) => area.toLowerCase().trim().replace(/\s+/g, '-')

/** Server side: the link to the area's page, or null when that area has no page (so a detail page never links to a 404). */
export async function areaPageHref(area?: string | null): Promise<string | null> {
  const name = String(area || '').trim()
  if (!name) return null
  try {
    const r = await propertyAPI.getAreaBySlug(areaSlug(name))
    return r.data?.success ? `/areas/${r.data.data?.slug || areaSlug(name)}` : null
  } catch { return null }
}
