import { tagHeadline, typePlural, type ListingKind } from '@/lib/listingTags'

// Search links built from GET /quick-links (live counts) — shared by the "More searches" block under the listing
// pages and the homepage's "Popular Real Estate Searches". Every link is a real, filtered listing URL.
export interface QuickLinksData {
  kind: ListingKind
  tags: { slug: string; label: string; count: number }[]
  types: { key: string; count: number }[]
  areas: { key: string; count: number }[]
  communities: { key: string; count: number }[]
  bedrooms: { key: string; count: number }[]
  developers: { key: string; count: number }[]
}
export type QuickLinkGroup = { id: 'popular' | 'types' | 'areas' | 'extra' | 'communities'; title: string; links: { href: string; label: string; count: number }[] }

export const LISTING_BASE: Record<ListingKind, string> = { sale: '/for-sale', rent: '/for-rent', projects: '/projects' }
const q = (k: string, v: string) => `${k}=${encodeURIComponent(v)}`

export function quickLinkGroups(data: QuickLinksData): QuickLinkGroup[] {
  const { kind } = data
  const base = LISTING_BASE[kind]
  const verb = kind === 'rent' ? 'for rent' : 'for sale'
  const groups: QuickLinkGroup[] = [
    {
      id: 'popular', title: 'Popular searches',
      links: data.tags.map(t => ({ href: `${base}?${q('tag', t.slug)}`, label: tagHeadline(t.slug, kind), count: t.count })),
    },
    {
      id: 'types', title: 'By property type',
      links: data.types.filter(t => t.key).map(t => ({
        href: `${base}?${q('type', t.key)}`,
        label: kind === 'projects' ? `Off-plan ${typePlural(t.key).toLowerCase()} in UAE` : `${typePlural(t.key)} ${verb} in UAE`,
        count: t.count,
      })),
    },
    {
      id: 'areas', title: 'Popular areas',
      links: data.areas.map(a => ({
        href: `${base}?${q('area', a.key)}`,
        label: kind === 'projects' ? `New projects in ${a.key}` : `Properties ${verb} in ${a.key}`,
        count: a.count,
      })),
    },
    kind === 'projects'
      ? {
        id: 'extra', title: 'By developer',
        links: data.developers.map(d => ({ href: `${base}?${q('developer', d.key)}`, label: `${d.key} projects`, count: d.count })),
      }
      : {
        id: 'extra', title: 'By bedrooms',
        links: data.bedrooms.map(b => {
          const n = Number(b.key)
          return { href: `${base}?${q('bedrooms', b.key)}`, label: n === 0 ? `Studios ${verb} in UAE` : `${n >= 6 ? '6+' : n} bedroom properties ${verb} in UAE`, count: b.count }
        }),
      },
    {
      id: 'communities', title: 'Popular communities',
      links: data.communities.map(c => ({
        href: `${base}?${q('community', c.key)}`,
        label: kind === 'projects' ? `New projects in ${c.key}` : `Properties ${verb} in ${c.key}`,
        count: c.count,
      })),
    },
  ]
  return groups.filter(g => g.links.length > 0)
}
