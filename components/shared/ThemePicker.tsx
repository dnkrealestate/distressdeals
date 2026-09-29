'use client'
import { Sun, Moon, Clock } from 'lucide-react'
import { useThemeStore, type ThemeMode } from '@/store/themeStore'

const OPTIONS: { v: ThemeMode; l: string; icon: typeof Sun }[] = [
  { v: 'auto', l: 'Auto', icon: Clock },
  { v: 'light', l: 'Light', icon: Sun },
  { v: 'dark', l: 'Dark', icon: Moon },
]

// Auto (dark 9 PM – 6 AM) / Light / Dark — used in the phone menu and on the profile pages.
export default function ThemePicker({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useThemeStore()
  return (
    <div>
      <div className="grid grid-cols-3 gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }} role="radiogroup" aria-label="Theme">
        {OPTIONS.map(o => {
          const on = mode === o.v
          return (
            <button key={o.v} role="radio" aria-checked={on} onClick={() => setMode(o.v)}
              className="flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold transition-colors"
              style={on ? { background: 'var(--surface)', color: 'var(--teal)', boxShadow: '0 1px 4px rgba(15,23,42,0.12)' } : { color: 'var(--text-muted)' }}>
              <o.icon size={13} /> {o.l}
            </button>
          )
        })}
      </div>
      {!compact && (
        <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
          Auto turns dark mode on from 9 PM to 6 AM (your device time).
        </p>
      )}
    </div>
  )
}
