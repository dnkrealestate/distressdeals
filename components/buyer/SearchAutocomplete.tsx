'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Building2, Home } from 'lucide-react'
import { propertyAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'

interface Suggestion { title: string; slug: string; price: number; location?: { area?: string } }
interface Suggestions { areas: string[]; projects: string[]; properties: Suggestion[] }

const EMPTY: Suggestions = { areas: [], projects: [], properties: [] }

// Debounced dropdown over the existing /properties/suggest endpoint — areas
// and projects deep-link straight to the filter that matters, individual
// properties go straight to their PDP, and plain Enter/submit still falls
// through to a normal text search for anything that doesn't match a suggestion.
export default function SearchAutocomplete({
  value, onChange, onSubmit, onSelectArea, onSelectProject, placeholder, inputClassName, inputStyle,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  onSelectArea?: (area: string) => void
  onSelectProject?: (project: string) => void
  placeholder?: string
  inputClassName?: string
  inputStyle?: React.CSSProperties
}) {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<Suggestions>(EMPTY)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = value.trim()
    if (q.length < 2) { setSuggestions(EMPTY); return }
    const t = setTimeout(() => {
      propertyAPI.suggest(q)
        .then(r => { if (r.data.success) setSuggestions(r.data.data) })
        .catch(() => setSuggestions(EMPTY))
    }, 250)
    return () => clearTimeout(t)
  }, [value])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const hasResults = suggestions.areas.length > 0 || suggestions.projects.length > 0 || suggestions.properties.length > 0
  const showDropdown = open && value.trim().length >= 2 && hasResults

  const pick = (fn: () => void) => { fn(); setOpen(false) }

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <input
        type="text"
        placeholder={placeholder || 'Search by project, area, or developer…'}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setOpen(false); onSubmit() } }}
        className={inputClassName || 'bg-transparent flex-1 text-sm outline-none w-full'}
        style={inputStyle}
      />

      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full mt-2 rounded-2xl overflow-hidden shadow-2xl z-50 max-h-96 overflow-y-auto"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {suggestions.areas.length > 0 && (
            <div className="p-2">
              <p className="text-[10px] uppercase tracking-wider font-semibold px-3 pt-1 pb-1.5" style={{ color: 'var(--text-muted)' }}>Areas</p>
              {suggestions.areas.map(area => (
                <button
                  key={area}
                  onClick={() => pick(() => onSelectArea ? onSelectArea(area) : router.push(`/areas/${area.toLowerCase().replace(/\s+/g, '-')}`))}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors hover:bg-[rgba(203,1,1,0.08)]"
                  style={{ color: 'var(--text)' }}
                >
                  <MapPin size={14} style={{ color: 'var(--teal)' }} /> {area}
                </button>
              ))}
            </div>
          )}

          {suggestions.projects.length > 0 && (
            <div className="p-2" style={{ borderTop: suggestions.areas.length ? '1px solid var(--border-soft)' : undefined }}>
              <p className="text-[10px] uppercase tracking-wider font-semibold px-3 pt-1 pb-1.5" style={{ color: 'var(--text-muted)' }}>Projects</p>
              {suggestions.projects.map(project => (
                <button
                  key={project}
                  onClick={() => pick(() => onSelectProject ? onSelectProject(project) : onChange(project))}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors hover:bg-[rgba(203,1,1,0.08)]"
                  style={{ color: 'var(--text)' }}
                >
                  <Building2 size={14} style={{ color: 'var(--teal)' }} /> {project}
                </button>
              ))}
            </div>
          )}

          {suggestions.properties.length > 0 && (
            <div className="p-2" style={{ borderTop: (suggestions.areas.length || suggestions.projects.length) ? '1px solid var(--border-soft)' : undefined }}>
              <p className="text-[10px] uppercase tracking-wider font-semibold px-3 pt-1 pb-1.5" style={{ color: 'var(--text-muted)' }}>Listings</p>
              {suggestions.properties.map(p => (
                <button
                  key={p.slug}
                  onClick={() => pick(() => router.push(`/buyer/properties/${p.slug}`))}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors hover:bg-[rgba(203,1,1,0.08)]"
                >
                  <Home size={14} className="flex-shrink-0" style={{ color: 'var(--teal)' }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate" style={{ color: 'var(--text)' }}>{p.title}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{p.location?.area} · {formatPrice(p.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
