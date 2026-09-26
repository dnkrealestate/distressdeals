'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

// A badge that explains itself: click (or Enter) opens a small note next to it. Safe inside a card that is a link —
// the click never opens the card. The note floats above the page, so a card's overflow can't cut it off.
export default function InfoBadge({ label, icon: Icon, title, message, className = '', style }: {
  label: string
  icon?: any
  title: string
  message: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<React.CSSProperties>({})
  const btn = useRef<HTMLButtonElement>(null)
  const pop = useRef<HTMLDivElement>(null)

  const place = () => {
    const r = btn.current?.getBoundingClientRect()
    if (!r) return
    const width = Math.min(280, window.innerWidth - 24)
    const left = Math.max(12, Math.min(r.left, window.innerWidth - width - 12))
    const below = window.innerHeight - r.bottom
    setPos(below < 170 ? { left, width, bottom: window.innerHeight - r.top + 8 } : { left, width, top: r.bottom + 8 })
  }
  useLayoutEffect(() => { if (open) place() }, [open])
  useEffect(() => {
    if (!open) return
    const close = (e: Event) => {
      if (e.type === 'keydown' && (e as KeyboardEvent).key !== 'Escape') return
      if (e.type === 'mousedown' && (btn.current?.contains(e.target as Node) || pop.current?.contains(e.target as Node))) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close)
      window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place)
    }
  }, [open])

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-label={`${label} — what does this mean?`}
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o) }}
        className={`badge text-[10px] font-semibold inline-flex items-center gap-1 cursor-help ${className}`}
        style={style}
      >
        {Icon && <Icon size={11} />}{label}
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div ref={pop} role="dialog" aria-label={title}
          className="fixed z-[160] rounded-xl p-3.5 shadow-2xl text-left"
          style={{ ...pos, background: 'var(--surface)', border: '1px solid var(--border)' }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
              {Icon && <Icon size={13} style={{ color: 'var(--teal)' }} />}{title}
            </p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="-mt-0.5 -mr-1 p-0.5" style={{ color: 'var(--text-muted)' }}><X size={13} /></button>
          </div>
          <div className="text-xs leading-relaxed" style={{ color: 'var(--text-mid)' }}>{message}</div>
        </div>,
        document.body,
      )}
    </>
  )
}

// The site's standard explanations.
export const VERIFIED_NOTE = 'Our quality control team has checked this listing — the developer, location, price and project details have been reviewed and confirmed before it went live on Distress Deals UAE.'
export const OFF_PLAN_NOTE = '‘Off-plan initial sale’ refers to a property development that is under construction and is being advertised as an initial purchase.'
