'use client'
import { useEffect, useState } from 'react'
import { Sparkles, Check, Plus, Loader2, Tag } from 'lucide-react'
import { projectAPI } from '@/lib/api'

// Feature tags on the project form. The server works out the automatic tags from what's been entered (price, type,
// payment plan, description…) and they update live as the form changes; the admin can switch any tag off, or switch
// extra ones on. Those choices are saved as overrides, so later edits never undo them.
export default function ProjectFeatureTags({ input, added, removed, onChange }: {
  input: Record<string, any>                       // the form's current values
  added: string[]
  removed: string[]
  onChange: (added: string[], removed: string[]) => void
}) {
  const [auto, setAuto] = useState<string[]>([])
  const [all, setAll] = useState<{ slug: string; label: string }[]>([])
  const [loading, setLoading] = useState(true)
  const key = JSON.stringify(input)

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      projectAPI.tagPreview(input)
        .then(r => { if (r.data.success) { setAuto(r.data.data.auto || []); setAll(r.data.data.all || []) } })
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const isAuto = (s: string) => auto.includes(s)
  const isOn = (s: string) => (isAuto(s) && !removed.includes(s)) || added.includes(s)
  const toggle = (s: string) => {
    if (isAuto(s)) onChange(added.filter(x => x !== s), removed.includes(s) ? removed.filter(x => x !== s) : [...removed, s])
    else onChange(added.includes(s) ? added.filter(x => x !== s) : [...added, s], removed.filter(x => x !== s))
  }
  const onCount = all.filter(t => isOn(t.slug)).length

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
        <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Tag size={14} /> Feature tags <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>· {onCount} on</span>
          {loading && <Loader2 size={12} className="animate-spin" style={{ color: 'var(--text-muted)' }} />}
        </h3>
        <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#16A34A' }} /> Automatic</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--teal)' }} /> Added by you</span>
        </div>
      </div>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        Written automatically from this project&apos;s price, type, payment plan, handover and description — they power the
        &ldquo;More searches&rdquo; links (e.g. <em>Luxury new projects in UAE</em>). Click a tag to switch it on or off.
      </p>
      <div className="flex flex-wrap gap-2">
        {all.map(t => {
          const on = isOn(t.slug), a = isAuto(t.slug), turnedOff = a && removed.includes(t.slug)
          const color = on ? (a ? '#16A34A' : 'var(--teal)') : 'var(--text-muted)'
          return (
            <button key={t.slug} type="button" onClick={() => toggle(t.slug)}
              title={turnedOff ? 'Automatic tag you switched off — click to switch back on' : a ? 'Automatic — click to switch off' : on ? 'Added by you — click to remove' : 'Click to add'}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
              style={on
                ? { background: a ? 'rgba(22,163,74,0.10)' : 'rgba(203,1,1,0.08)', color, border: `1px solid ${a ? 'rgba(22,163,74,0.35)' : 'rgba(203,1,1,0.3)'}` }
                : { background: 'transparent', color, border: '1px dashed var(--border)', textDecoration: turnedOff ? 'line-through' : undefined }}>
              {on ? (a ? <Sparkles size={11} /> : <Check size={11} />) : <Plus size={11} />}
              {t.label}
            </button>
          )
        })}
        {!all.length && !loading && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Could not load tags.</p>}
      </div>
    </div>
  )
}
