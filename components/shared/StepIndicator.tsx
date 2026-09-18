'use client'
import { Check } from 'lucide-react'

// Green filled circle + connecting line stepper — shared by the admin and
// seller listing wizards. Works with any number of steps (labels.length).
export default function StepIndicator({
  step, onJump, labels = ['Details', 'Amenities', 'Uploads'],
}: {
  step: number
  onJump: (s: number) => void
  labels?: string[]
}) {
  return (
    <div className="flex items-center mb-6 flex-wrap gap-y-3">
      {labels.map((label, i) => {
        const n = i + 1
        return (
          <div key={n} className="flex items-center" style={i < labels.length - 1 ? { flex: 1, minWidth: 'fit-content' } : undefined}>
            <button
              type="button"
              onClick={() => onJump(n)}
              className="flex items-center gap-2 flex-shrink-0"
              style={{ cursor: 'pointer', background: 'none', border: 'none' }}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: step >= n ? 'var(--grad)' : 'var(--bg-alt)',
                  color:      step >= n ? '#fff' : 'var(--text-muted)',
                  border:     step >= n ? 'none' : '1px solid var(--border)',
                }}
              >
                {step > n ? <Check size={13} /> : n}
              </span>
              <span className="text-sm font-semibold whitespace-nowrap" style={{ color: step >= n ? 'var(--text)' : 'var(--text-muted)' }}>{label}</span>
            </button>
            {i < labels.length - 1 && (
              <div className="flex-1 h-px mx-4" style={{ background: step > n ? 'var(--teal)' : 'var(--border)', minWidth: 20 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
