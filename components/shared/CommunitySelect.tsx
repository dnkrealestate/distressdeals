'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { communityContentAPI } from '@/lib/api'

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

export default function CommunitySelect({
  field, value, emirate, list: given,
}: {
  field: UseFormRegisterReturn
  value?: string
  emirate?: string          // this emirate's communities are listed first
  list?: CommunityOption[]  // pass the parent's copy when it also uses the list; otherwise it loads its own
}) {
  const own = useCommunities()
  const list = given ?? own
  const groups = new Map<string, CommunityOption[]>()
  for (const c of list) {
    const e = c.emirate || 'Dubai'
    if (!groups.has(e)) groups.set(e, [])
    groups.get(e)!.push(c)
  }
  const order = [...groups.keys()].sort((a, b) => (a === emirate ? -1 : b === emirate ? 1 : a.localeCompare(b)))
  const known = list.some(c => c.name === value)

  // When the directory arrives the options are rebuilt, and a browser drops a <select>'s selection when its chosen
  // <option> node is replaced — put the saved value back once the new options have rendered.
  const selectRef = useRef<HTMLSelectElement | null>(null)
  useEffect(() => {
    if (selectRef.current && value && selectRef.current.value !== value) selectRef.current.value = value
  }, [list, value])

  return (
    <div>
      <select className="select-field" {...field} ref={el => { field.ref(el); selectRef.current = el }}>
        <option value="">— None —</option>
        {/* A saved value that isn't in the directory (older listings) still shows, instead of silently blanking. */}
        {value && !known && <option value={value}>{value}</option>}
        {order.map(e => (
          <optgroup key={e} label={e}>
            {groups.get(e)!.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
              <option key={c.name} value={c.name}>{c.name}{c.area && c.area !== c.name ? ` · ${c.area}` : ''}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
        Not in the list?{' '}
        <Link href="/admin/communities?new=1" target="_blank" className="inline-flex items-center gap-0.5 font-semibold hover:underline" style={{ color: 'var(--teal)' }}>
          <Plus size={11} /> Add new community
        </Link>
      </p>
    </div>
  )
}
