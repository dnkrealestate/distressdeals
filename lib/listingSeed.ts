import { propertyAPI, projectAPI } from '@/lib/api'
import { projectForCard } from '@/lib/cardData'
import type { Property, Project } from '@/types'

// The Buy / Rent lists, rendered on the server in their fixed "Best Opportunities" order — the same requests the list
// makes in the browser (see PropertiesListClient fetchList). Page 1 is what search engines (and the first paint) see
// before the visitor's personalised feed takes over; /for-sale?page=N are stable pages of their own.
export const LIST_PER_PAGE = 40   // = PropertiesListClient PER_PAGE

// New projects join the Buy list for these property types (or when no type is chosen) — PropertiesListClient PROJECT_TYPES.
const PROJECT_TYPES = ['apartment', 'villa', 'townhouse', 'penthouse', 'studio', 'commercial', 'office', 'retail', 'warehouse', 'commercial_villa']

export interface ListingSeed {
  properties: Property[]; projects: Project[]; order: string
  total: number; projectTotal: number; totalPages: number; page: number
}

// Only plain list URLs (/for-sale, ?type=…, ?page=…) are rendered on the server; any other filter is left to the
// browser exactly as before.
const SEEDABLE = new Set(['type', 'page'])

export async function listingSeed(listingType: 'sale' | 'rent', sp?: Record<string, string | undefined>): Promise<ListingSeed | undefined> {
  if (sp && Object.entries(sp).some(([k, v]) => v && !SEEDABLE.has(k))) return undefined
  const page = Math.max(1, Math.floor(Number(sp?.page) || 1))
  const type = sp?.type || undefined
  const withProjects = listingType === 'sale' && (!type || PROJECT_TYPES.includes(type))
  const pParams: Record<string, string> = type ? { type } : {}
  try {
    const plan = (await propertyAPI.getOpportunityPlan({ listingType, ...(type ? { type } : {}), page, perPage: LIST_PER_PAGE, ...(withProjects ? { projects: JSON.stringify(pParams) } : {}) })).data.data
    const [pr, pj] = await Promise.all([
      plan.properties.limit
        ? propertyAPI.getAll({ listingType, ...(type ? { type } : {}), sortBy: 'opportunity', offset: plan.properties.offset, limit: plan.properties.limit }).then(r => r.data.data?.data || [])
        : Promise.resolve([]),
      withProjects && plan.projects.limit
        ? projectAPI.getAll({ ...pParams, sortBy: 'opportunity', offset: plan.projects.offset, limit: plan.projects.limit }).then(r => r.data.data?.data || [])
        : Promise.resolve([]),
    ])
    return {
      properties: pr, projects: (pj as Project[]).map(projectForCard), order: plan.order || '',
      total: plan.properties.total || 0, projectTotal: withProjects ? plan.projects.total || 0 : 0,
      totalPages: Math.max(1, plan.totalPages || 1), page,
    }
  } catch {
    return undefined
  }
}
