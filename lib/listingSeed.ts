import { cache } from 'react'
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

// Only the list URLs that are pages of their own (/for-sale, ?type=…, ?tag=…, ?page=…) are rendered on the server;
// any other filter is left to the browser exactly as before. Tracking tags (?utm_source=… on a shared link) don't
// change the list.
const SEEDABLE = new Set(['type', 'tag', 'page'])
const TRACKING = /^(utm_|gclid$|gbraid$|wbraid$|fbclid$|msclkid$|ttclid$|ref$)/i

export async function listingSeed(listingType: 'sale' | 'rent', sp?: Record<string, string | undefined>): Promise<ListingSeed | undefined> {
  if (sp && Object.entries(sp).some(([k, v]) => v && !SEEDABLE.has(k) && !TRACKING.test(k))) return undefined
  return seedFor(listingType, sp?.type || '', sp?.tag || '', Math.max(1, Math.floor(Number(sp?.page) || 1)))
}

// One fetch per request, shared by generateMetadata (an empty list isn't indexed) and the page.
const seedFor = cache(async (listingType: 'sale' | 'rent', typeArg: string, tagArg: string, page: number): Promise<ListingSeed | undefined> => {
  const type = typeArg || undefined
  const tag = tagArg || undefined
  const withProjects = listingType === 'sale' && (!type || PROJECT_TYPES.includes(type))
  const pParams: Record<string, string> = { ...(type ? { type } : {}), ...(tag ? { tag } : {}) }
  try {
    const plan = (await propertyAPI.getOpportunityPlan({ listingType, ...pParams, page, perPage: LIST_PER_PAGE, ...(withProjects ? { projects: JSON.stringify(pParams) } : {}) })).data.data
    const [pr, pj] = await Promise.all([
      plan.properties.limit
        ? propertyAPI.getAll({ listingType, ...pParams, sortBy: 'opportunity', offset: plan.properties.offset, limit: plan.properties.limit }).then(r => r.data.data?.data || [])
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
})
