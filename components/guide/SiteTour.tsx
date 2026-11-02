'use client'

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Compass, LayoutGrid, Rocket, Search, Sparkles, User, X, type LucideIcon } from 'lucide-react'

// First-visit guide on the home page (same idea as the app's guide, mobile/components/guide/CoachTour.tsx).
// It never blocks the page on arrival: a small card offers the tour, and only if the visitor accepts does the
// screen dim and a spotlight walk through each control. Controls opt in with data-tour="…"; the first visible match
// is used, so one step can point at the desktop menu or the phone's bottom bar. Shown once per browser.

const KEY = 'dd_site_guide_v1'

interface Step { target?: string; icon: LucideIcon; title: string; body: string }

const STEPS: Step[] = [
  { target: 'search', icon: Search, title: 'Search your way', body: 'Pick Buy, Rent or New Projects, then type an area, a community or a project name. The map button shows everything on a map.' },
  { target: 'nav', icon: LayoutGrid, title: 'Browse by category', body: 'Jump straight to properties for sale, rentals, new projects and market insights.' },
  { target: 'sell', icon: Rocket, title: 'Selling a property?', body: 'List it in a few steps. Our team reviews your listing, handles buyer enquiries and keeps you updated.' },
  { target: 'account', icon: User, title: 'Your account', body: 'Sign in to save properties, compare them side by side and get alerts about new projects.' },
  { icon: Sparkles, title: "You're all set!", body: 'Start exploring — and whenever you are ready to sell, "List Your Property" is one click away.' },
]

const seen = () => { try { return localStorage.getItem(KEY) === '1' } catch { return true } }
const markSeen = () => { try { localStorage.setItem(KEY, '1') } catch { /* private mode: shows again next time */ } }

function findTarget(id: string): HTMLElement | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`))
  return els.find(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' }) ?? null
}

export default function SiteTour() {
  const [mode, setMode] = useState<'off' | 'invite' | 'tour'>('off')

  // A moment after the page has settled, so the invite doesn't compete with the first paint.
  useEffect(() => {
    if (seen()) return
    const id = setTimeout(() => setMode('invite'), 2500)
    return () => clearTimeout(id)
  }, [])

  const close = useCallback(() => { markSeen(); setMode('off') }, [])

  if (mode === 'off') return null
  return createPortal(
    mode === 'invite' ? <Invite onStart={() => setMode('tour')} onClose={close} /> : <Tour onClose={close} />,
    document.body,
  )
}

function Invite({ onStart, onClose }: { onStart: () => void; onClose: () => void }) {
  return (
    <motion.div
      role="dialog" aria-label="Take a quick tour"
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed z-[70] left-4 right-4 bottom-[88px] xl:bottom-6 xl:left-6 xl:right-auto xl:w-[360px] rounded-2xl p-4 shadow-2xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <button onClick={onClose} aria-label="No thanks" className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
        <X size={16} />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="relative w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--grad)' }}>
          <Compass size={20} className="text-white" />
          <span className="absolute inset-0 rounded-full tour-ping" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--teal)' }}>New here?</p>
          <p className="font-bold text-base leading-snug" style={{ color: 'var(--text)' }}>Take a 30-second tour</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-mid)' }}>See how to search, browse and list a property with us.</p>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={onStart} className="btn-primary btn-sm flex-1 justify-center">Show me around <ArrowRight size={14} /></button>
        <button onClick={onClose} className="btn-ghost btn-sm">Not now</button>
      </div>
    </motion.div>
  )
}

type Rect = { top: number; left: number; width: number; height: number }
const PAD = 8

function Tour({ onClose }: { onClose: () => void }) {
  // Only the steps whose control is on this page for this visitor (e.g. no sign-in step once signed in).
  const [steps] = useState(() => STEPS.filter(s => !s.target || findTarget(s.target)))
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [vp, setVp] = useState({ w: 0, h: 0 })
  const step = steps[index]
  const last = index === steps.length - 1
  const Icon = step.icon

  // Bring the control into view, then keep the spotlight on it while the page scrolls or resizes.
  useLayoutEffect(() => {
    const el = step.target ? findTarget(step.target) : null
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (el) el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
    const update = () => {
      setVp({ w: window.innerWidth, h: window.innerHeight })
      if (!el) return setRect(null)
      const r = el.getBoundingClientRect()
      setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const t = setInterval(update, 120)
    const stop = setTimeout(() => clearInterval(t), 900)
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); clearInterval(t); clearTimeout(stop) }
  }, [step])

  const next = useCallback(() => (last ? onClose() : setIndex(i => i + 1)), [last, onClose])
  const back = () => setIndex(i => Math.max(0, i - 1))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      else if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, onClose])

  // Card under the control when it sits in the top half of the screen, above it otherwise; centred with no control.
  const cardW = Math.min(380, vp.w - 32)
  const below = rect ? rect.top + rect.height / 2 < vp.h / 2 : false
  const cardLeft = rect ? Math.min(Math.max(rect.left + rect.width / 2 - cardW / 2, 16), vp.w - cardW - 16) : (vp.w - cardW) / 2
  const cardStyle: React.CSSProperties = rect
    ? below ? { top: Math.min(rect.top + rect.height + 14, vp.h - 260), left: cardLeft, width: cardW } : { bottom: Math.max(vp.h - rect.top + 14, 16), left: cardLeft, width: cardW }
    : { top: '50%', left: cardLeft, width: cardW, transform: 'translateY(-50%)' }
  const arrowX = rect ? Math.min(Math.max(rect.left + rect.width / 2 - cardLeft - 8, 20), cardW - 36) : 0

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Site tour">
      {/* Dim layer with a rounded spotlight cut out (a huge shadow around the spotlight box). */}
      <div
        className="absolute rounded-2xl pointer-events-none"
        style={rect
          ? { ...rect, boxShadow: '0 0 0 9999px rgba(6,9,15,0.72)', transition: 'top .35s cubic-bezier(.16,1,.3,1), left .35s cubic-bezier(.16,1,.3,1), width .35s cubic-bezier(.16,1,.3,1), height .35s cubic-bezier(.16,1,.3,1)' }
          : { top: '50%', left: '50%', width: 0, height: 0, boxShadow: '0 0 0 9999px rgba(6,9,15,0.72)' }}
      />
      {rect && <div className="absolute rounded-2xl pointer-events-none tour-ring" style={rect} />}
      {/* Clicks on the dim area don't reach the page underneath. */}
      <div className="absolute inset-0" onClick={e => e.stopPropagation()} />

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: below || !rect ? 10 : -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.22, delay: 0.12 }}
          className="fixed"
          style={cardStyle}
        >
          {rect && <span aria-hidden className="absolute w-4 h-4 rotate-45 rounded-[3px]" style={{ left: arrowX, ...(below ? { top: -7 } : { bottom: -7 }), background: 'var(--surface)' }} />}
          <div className="relative rounded-2xl p-5 shadow-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} aria-live="polite">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--grad)' }}>
                <Icon size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold" style={{ color: 'var(--teal)' }}>Step {index + 1} of {steps.length}</p>
                <p className="font-bold text-lg leading-snug" style={{ color: 'var(--text)' }}>{step.title}</p>
              </div>
              {!last && <button onClick={onClose} className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Skip</button>}
            </div>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-mid)' }}>{step.body}</p>
            <div className="flex items-center justify-between mt-4 gap-3">
              <div className="flex items-center gap-1.5" aria-hidden>
                {steps.map((_, i) => (
                  <span key={i} className="h-1.5 rounded-full transition-all duration-300" style={{ width: i === index ? 18 : 6, background: i === index ? 'var(--teal)' : 'var(--border)' }} />
                ))}
              </div>
              <div className="flex gap-2">
                {index > 0 && (
                  <button onClick={back} aria-label="Previous step" className="w-10 h-10 rounded-full flex items-center justify-center" style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
                    <ArrowLeft size={16} />
                  </button>
                )}
                <button onClick={next} autoFocus className="btn-primary btn-sm h-10 px-5 rounded-full">
                  {last ? 'Got it' : <>Next <ArrowRight size={14} /></>}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
