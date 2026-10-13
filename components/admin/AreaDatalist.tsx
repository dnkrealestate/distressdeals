'use client'
import { useEffect, useState } from 'react'
import { propertyAPI } from '@/lib/api'

// Suggestions for an "Area" input (<input list={id}>): every area that already has a page, so the same district is
// typed the same way each time. A name that is not in the list is a new area — it gets its own page automatically.
export default function AreaDatalist({ id }: { id: string }) {
  const [areas, setAreas] = useState<string[]>([])
  useEffect(() => {
    propertyAPI.getAllAreas().then(r => { if (r.data.success) setAreas([...new Set<string>((r.data.data || []).map((a: any) => a.area))].sort()) }).catch(() => {})
  }, [])
  return <datalist id={id}>{areas.map(a => <option key={a} value={a} />)}</datalist>
}
