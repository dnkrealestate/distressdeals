'use client'
import { useEffect, useRef, useState } from 'react'
import { Building2, CornerDownLeft } from 'lucide-react'
import { projectAPI } from '@/lib/api'

// The project-name field of the admin form, with suggestions from the projects already on the site as you type.
// Picking one uses the exact same spelling — which is what keeps unit types of one project together as one project
// (see lib/indexability.ts) — and fills in its developer and area when those are still empty.
export interface NameSuggestion { title: string; developer?: string; area?: string; community?: string; emirate?: string; type?: string; units: number }

export default function ProjectNameInput({ value, onChange, onPick, invalid, inputProps }: {
  value: string
  onChange: (v: string) => void
  onPick: (s: NameSuggestion) => void
  invalid?: boolean
  inputProps?: Record<string, any>
}) {
  const [list, setList] = useState<NameSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const box = useRef<HTMLDivElement>(null)
  const typed = useRef(false)

  useEffect(() => {
    const q = (value || '').trim()
    if (!typed.current || q.length < 2) { setList([]); return }
    const t = setTimeout(() => {
      projectAPI.nameSuggestions(q).then(r => { setList(r.data?.data || []); setActive(-1); setOpen(true) }).catch(() => setList([]))
    }, 250)
    return () => clearTimeout(t)
  }, [value])
  useEffect(() => {
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const pick = (s: NameSuggestion) => { typed.current = false; onChange(s.title); onPick(s); setOpen(false); setList([]) }
  const exact = list.some(s => s.title.toLowerCase() === (value || '').trim().toLowerCase())

  return (
    <div className="relative" ref={box}>
      <input
        {...inputProps}
        className="input text-lg font-bold w-full" style={{ padding: '12px 14px', ...(invalid ? { borderColor: '#FB7185' } : {}) }}
        placeholder="e.g. Boulevard Point" autoComplete="off" value={value}
        onChange={e => { typed.current = true; onChange(e.target.value) }}
        onFocus={() => { if (list.length) setOpen(true) }}
        onKeyDown={e => {
          if (!open || !list.length) return
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(list.length - 1, i + 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(0, i - 1)) }
          else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(list[active]) }
          else if (e.key === 'Escape') setOpen(false)
        }}
      />
      {open && list.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-40 rounded-xl shadow-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} role="listbox">
          <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Existing projects — pick one to add another unit type to it</p>
          {list.map((s, i) => (
            <button key={`${s.title}|${s.developer}`} type="button" role="option" aria-selected={i === active}
              onMouseDown={e => e.preventDefault()} onClick={() => pick(s)} onMouseEnter={() => setActive(i)}
              className="w-full text-left flex items-center gap-3 px-3 py-2.5 transition-colors"
              style={{ background: i === active ? 'rgba(203,1,1,0.06)' : 'transparent' }}>
              <Building2 size={15} className="flex-shrink-0" style={{ color: 'var(--teal)' }} />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{s.title}</span>
                <span className="block text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{[s.developer, [s.community, s.area].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}</span>
              </span>
              <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{s.units} unit type{s.units === 1 ? '' : 's'}</span>
              {i === active && <CornerDownLeft size={12} style={{ color: 'var(--text-muted)' }} />}
            </button>
          ))}
          {!exact && <p className="px-3 py-2 text-[11px]" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-soft)' }}>Or keep typing to add a new project with this name.</p>}
        </div>
      )}
    </div>
  )
}
