'use client'
import toast from 'react-hot-toast'
import { AlertTriangle, X } from 'lucide-react'

// Shown when a buyer tries to put ready and off-plan listings in the same comparison. Offers to start a fresh
// comparison with the item they just picked, instead of silently refusing.
export function warnCompareConflict(message: string, onStartNew: () => void) {
  toast.custom(t => (
    <div
      className="w-[min(92vw,380px)] rounded-2xl p-4 flex gap-3 shadow-xl"
      style={{ background: 'var(--surface)', border: '1px solid rgba(245,158,11,0.45)', opacity: t.visible ? 1 : 0, transition: 'opacity .2s' }}
      role="alert"
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>
        <AlertTriangle size={17} style={{ color: '#D97706' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Can&apos;t compare these together</p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{message}</p>
        <div className="flex gap-2 mt-3">
          <button onClick={() => { toast.dismiss(t.id); onStartNew() }} className="btn-primary btn-sm">Start new comparison</button>
          <button onClick={() => toast.dismiss(t.id)} className="btn-ghost btn-sm">Keep current</button>
        </div>
      </div>
      <button onClick={() => toast.dismiss(t.id)} aria-label="Close" className="self-start p-1 -m-1" style={{ color: 'var(--text-muted)' }}>
        <X size={14} />
      </button>
    </div>
  ), { id: 'compare-conflict', duration: 8000 })
}

export const READY_VS_OFFPLAN = 'Ready properties and off-plan properties can’t be compared side by side — their prices, payments and timelines work differently.'
export const READY_VS_PROJECT = 'Ready properties can’t be compared with off-plan projects — their prices, payments and timelines work differently.'
export const OFFPLAN_VS_PROJECT = 'Off-plan properties and new projects are compared separately, on their own pages.'
