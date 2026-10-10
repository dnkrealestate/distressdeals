// Which pages search engines should index — the same rules as the backend (utils/indexability.ts). Google leaves
// near-copies and very thin pages out of its index anyway; listing them only wastes its crawling.
//   • A new project entered once per unit type (same name, same developer) is one project: every record's canonical
//     points at the first one created, and only that one goes in the sitemap.
//   • A building guide is indexed once it has a written overview of its own.
const norm = (v: any) => String(v ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
export const projectGroupKey = (p: { title?: string; developer?: string }) => `${norm(p.title)}|${norm(p.developer)}`
export function groupPrimaries<T extends { title?: string; developer?: string; createdAt?: string; _id?: string }>(list: T[]): T[] {
  const groups = new Map<string, T[]>()
  for (const p of list) { const k = projectGroupKey(p); (groups.get(k) || groups.set(k, []).get(k)!).push(p) }
  return [...groups.values()].map(g => [...g].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime() || String(a._id).localeCompare(String(b._id)))[0])
}
const plain = (v: any) => String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
export const buildingIndexable = (b: { overview?: string }) => plain(b.overview).length >= 600
