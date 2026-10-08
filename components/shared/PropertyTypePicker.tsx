'use client'
import { useEffect, useState } from 'react'
import { Home } from 'lucide-react'
import { FilterDropdown, RESIDENTIAL_TYPES, COMMERCIAL_TYPES } from '@/components/buyer/PropertyFilterBar'

// One way to choose a property type everywhere: two tabs — Residential and Commercial — with that group's types
// underneath (the model of the homepage search box). Three shapes of the same thing:
//   • <TypeTabs>              the tabs + options themselves (used inside a dropdown panel)
//   • <PropertyTypeDropdown>  a filter button that opens them
//   • <PropertyTypeInline>    tabs + chips laid out in the page, for filter sheets and forms
export interface TypeOption { v: string; l: string }
export type TypeGroup = 'residential' | 'commercial'
const TABS: { key: TypeGroup; label: string }[] = [{ key: 'residential', label: 'Residential' }, { key: 'commercial', label: 'Commercial' }]
const RES: TypeOption[] = RESIDENTIAL_TYPES.map(t => ({ v: t.v, l: t.l }))
const COM: TypeOption[] = COMMERCIAL_TYPES.map(t => ({ v: t.v, l: t.l }))

// Which tab a value belongs to (Residential when nothing is chosen).
const groupOf = (value: string | undefined, commercial: TypeOption[]): TypeGroup => (value && commercial.some(t => t.v === value) ? 'commercial' : 'residential')
export const typeLabelOf = (value: string | undefined, residential: TypeOption[] = RES, commercial: TypeOption[] = COM) =>
  [...residential, ...commercial].find(t => t.v === value)?.l

function useTab(value: string | undefined, commercial: TypeOption[], group?: TypeGroup) {
  const [tab, setTab] = useState<TypeGroup>(group || groupOf(value, commercial))
  // Follow the value when it is changed from outside (a cleared filter, a link, another control).
  useEffect(() => { if (value) setTab(groupOf(value, commercial)) }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (group) setTab(group) }, [group])
  return [tab, setTab] as const
}

function Tabs({ tab, onTab }: { tab: TypeGroup; onTab: (t: TypeGroup) => void }) {
  return (
    <div className="flex gap-1.5" role="tablist" aria-label="Property category">
      {TABS.map(t => (
        <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => onTab(t.key)}
          className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
          style={{ background: tab === t.key ? 'var(--grad)' : 'var(--bg-alt)', color: tab === t.key ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

interface Common {
  value?: string
  onChange: (type: string) => void
  // Override the lists where a page offers fewer types (e.g. new projects).
  residential?: TypeOption[]
  commercial?: TypeOption[]
  // Adds an "all types" choice that clears the selection. Pass '' to leave it out (forms where a type is required).
  allLabel?: string
  // Tell the page which tab is open (the homepage search keeps its own Residential/Commercial state).
  group?: TypeGroup
  onGroupChange?: (g: TypeGroup) => void
}

// Tabs + a vertical list of options — the body of a dropdown panel.
export function TypeTabs({ value, onChange, residential = RES, commercial = COM, allLabel = 'All types', group, onGroupChange, onPicked }: Common & { onPicked?: () => void }) {
  const [tab, setTab] = useTab(value, commercial, group)
  const options = tab === 'commercial' ? commercial : residential
  const pick = (v: string) => { onChange(v); onPicked?.() }
  const row = (active: boolean) => ({ background: active ? 'rgba(203,1,1,0.08)' : 'transparent', color: active ? 'var(--teal)' : 'var(--text-mid)' })
  return (
    <div>
      <div className="mb-3"><Tabs tab={tab} onTab={t => { setTab(t); onGroupChange?.(t) }} /></div>
      <div className="flex flex-col gap-1 max-h-60 overflow-y-auto" role="tabpanel">
        {allLabel && (
          <button type="button" onClick={() => pick('')} className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bg-alt)]" style={row(!value)}>{allLabel}</button>
        )}
        {options.map(t => (
          <button key={t.v} type="button" onClick={() => pick(t.v)} className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bg-alt)]" style={row(value === t.v)}>{t.l}</button>
        ))}
      </div>
    </div>
  )
}

// A filter button showing the chosen type; opens the tabs.
export function PropertyTypeDropdown({ placeholder = 'Property Type', widthClass = 'w-56', fullWidth, align, ...p }: Common & { placeholder?: string; widthClass?: string; fullWidth?: boolean; align?: 'left' | 'right' }) {
  return (
    <FilterDropdown label={typeLabelOf(p.value, p.residential, p.commercial) || placeholder} icon={Home} active={!!p.value} widthClass={widthClass} fullWidth={fullWidth} align={align}>
      {close => <TypeTabs {...p} onPicked={close} />}
    </FilterDropdown>
  )
}

// Tabs with the options as chips, laid out in the page — for filter sheets and forms (nothing floats or closes).
export function PropertyTypeInline({ value, onChange, residential = RES, commercial = COM, allLabel = 'All types', group, onGroupChange }: Common) {
  const [tab, setTab] = useTab(value, commercial, group)
  const options = tab === 'commercial' ? commercial : residential
  const chip = (active: boolean) => ({
    background: active ? 'rgba(203,1,1,0.08)' : 'var(--surface)', color: active ? 'var(--teal)' : 'var(--text-mid)',
    border: `1px solid ${active ? 'rgba(203,1,1,0.45)' : 'var(--border)'}`,
  })
  return (
    <div>
      <div className="mb-2.5 max-w-xs"><Tabs tab={tab} onTab={t => { setTab(t); onGroupChange?.(t) }} /></div>
      <div className="flex flex-wrap gap-1.5" role="tabpanel">
        {allLabel && <button type="button" onClick={() => onChange('')} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors" style={chip(!value)}>{allLabel}</button>}
        {options.map(t => (
          <button key={t.v} type="button" onClick={() => onChange(t.v)} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors" style={chip(value === t.v)}>{t.l}</button>
        ))}
      </div>
    </div>
  )
}
