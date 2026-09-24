'use client'
import { Check } from 'lucide-react'
import { type ModuleDef } from '@/lib/modules'
import type { AgentPermission } from '@/types'

// One checkbox per module — each can be switched on or off on its own — grouped, with select-all/clear per group.
export default function ModulePicker({
  groups, value, onChange,
}: {
  groups: { title: string; modules: ModuleDef[] }[]
  value: AgentPermission[]
  onChange: (next: AgentPermission[]) => void
}) {
  const toggle = (key: AgentPermission) =>
    onChange(value.includes(key) ? value.filter(k => k !== key) : [...value, key])
  const setGroup = (modules: ModuleDef[], on: boolean) => {
    const keys = modules.map(m => m.key)
    onChange(on ? [...new Set([...value, ...keys])] : value.filter(k => !keys.includes(k)))
  }

  return (
    <div className="space-y-4">
      {groups.map(g => {
        const selected = g.modules.filter(m => value.includes(m.key)).length
        return (
          <div key={g.title}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {g.title} <span className="normal-case tracking-normal font-normal">· {selected}/{g.modules.length} selected</span>
              </p>
              <div className="flex gap-2 text-[11px]">
                <button type="button" onClick={() => setGroup(g.modules, true)} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>Select all</button>
                <button type="button" onClick={() => setGroup(g.modules, false)} className="font-medium hover:underline" style={{ color: 'var(--text-muted)' }}>Clear</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {g.modules.map(m => {
                const on = value.includes(m.key)
                return (
                  <button
                    key={m.key} type="button" onClick={() => toggle(m.key)} role="checkbox" aria-checked={on}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-colors"
                    style={{
                      background: on ? 'rgba(203,1,1,0.06)' : 'var(--bg-alt)',
                      border: `1px solid ${on ? 'var(--teal)' : 'var(--border)'}`,
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: on ? 'var(--teal)' : 'var(--surface)', border: `1px solid ${on ? 'var(--teal)' : 'var(--border)'}` }}
                    >
                      {on && <Check size={11} className="text-white" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold" style={{ color: 'var(--text)' }}>{m.label}</span>
                      <span className="block text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>{m.hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
