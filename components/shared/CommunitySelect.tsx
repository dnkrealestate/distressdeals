'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { communityContentAPI } from '@/lib/api'
import SearchSelect, { type SearchOption } from './SearchSelect'

export interface CommunityOption { name: string; area?: string; emirate?: string }

// One shared, lightly cached copy of the community directory for the listing forms.
let cache: Promise<CommunityOption[]> | null = null
const loadCommunities = (fresh = false) => {
  if (!cache || fresh) {
    cache = communityContentAPI.getAll()
      .then(r => (r.data.data || []).map((c: any) => ({ name: c.name, area: c.area, emirate: c.emirate || 'Dubai' })))
      .catch(() => { cache = null; return [] })
  }
  return cache
}

// The communities we manage (Admin → Communities), refreshed whenever the tab regains focus — so one added in
// another tab via "Add new community" shows up without reloading the form.
export function useCommunities() {
  const [list, setList] = useState<CommunityOption[]>([])
  useEffect(() => {
    let alive = true
    loadCommunities().then(l => { if (alive) setList(l) })
    const onFocus = () => loadCommunities(true).then(l => { if (alive) setList(l) })
    window.addEventListener('focus', onFocus)
    return () => { alive = false; window.removeEventListener('focus', onFocus) }
  }, [])
  return list
}

// Case-insensitive match of a picked place (its name, then its area) against the directory.
export function matchCommunity(list: CommunityOption[], ...candidates: (string | undefined)[]) {
  for (const c of candidates) {
    const t = (c || '').trim().toLowerCase()
    if (!t) continue
    const hit = list.find(o => o.name.toLowerCase() === t || o.name.toLowerCase().replace(/\s*\(.*\)$/, '') === t)
    if (hit) return hit
  }
  return null
}

// Searchable community picker — type to narrow the list; grouped by emirate (the listing's own emirate first).
export default function CommunitySelect({ value, onChange, emirate, list: given }: {
  value: string
  onChange: (v: string) => void
  emirate?: string          // this emirate's communities are listed first
  list?: CommunityOption[]  // pass the parent's copy when it also uses the list; otherwise it loads its own
}) {
  const own = useCommunities()
  const list = given ?? own
  const options = useMemo<SearchOption[]>(() => {
    const order = (e?: string) => (e === emirate ? '0' : '1') + (e || 'Dubai')
    return [...list]
      .sort((a, b) => order(a.emirate).localeCompare(order(b.emirate)) || a.name.localeCompare(b.name))
      .map(c => ({ value: c.name, label: c.name, hint: c.area && c.area !== c.name ? `in ${c.area}` : undefined, group: c.emirate || 'Dubai' }))
  }, [list, emirate])

  return (
    <SearchSelect
      value={value || ''}
      onChange={onChange}
      options={options}
      placeholder="— None —"
      searchPlaceholder="Search communities…"
      emptyText="No community with that name"
      footer={
        <Link href="/admin/communities?new=1" target="_blank" className="inline-flex items-center gap-1 font-semibold hover:underline" style={{ color: 'var(--teal)' }}>
          <Plus size={12} /> Add new community
        </Link>
      }
    />
  )
}
