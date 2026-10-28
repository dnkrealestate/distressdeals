'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// One line of chips, tabs or cards that never wraps or breaks the layout: it scrolls sideways (touch, trackpad, the
// visible scrollbar, or the arrow buttons that appear on the side that has more).
// variant 'chips' (default): small arrows over the ends, with a soft fade at the edge that has more.
// variant 'cards': card sliders — larger arrows over the cards' middle, snap to each card, and room above/below so a
// card's hover lift and shadow are not cut off. No fade (it would dim the cards).
export default function ScrollRow({
  children, className, innerClassName = 'gap-2', label, variant = 'chips', role,
}: {
  children: React.ReactNode
  className?: string
  innerClassName?: string
  label?: string
  variant?: 'chips' | 'cards'
  role?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })
  const cards = variant === 'cards'

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdges({ left: el.scrollLeft > 2, right: el.scrollLeft < max - 2 })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    Array.from(el.children).forEach(c => ro.observe(c))
    return () => ro.disconnect()
  }, [update, children])

  // Keep the chosen chip in view (e.g. a type picked from a link further along the row).
  useEffect(() => {
    if (cards) return
    const el = ref.current
    const on = el?.querySelector<HTMLElement>('[aria-pressed="true"], [aria-selected="true"], [aria-current="page"]')
    if (el && on && (on.offsetLeft < el.scrollLeft || on.offsetLeft + on.offsetWidth > el.scrollLeft + el.clientWidth)) {
      el.scrollTo({ left: on.offsetLeft - 16, behavior: 'smooth' })
    }
  }, [children, cards])

  const by = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * Math.max(160, ref.current.clientWidth * (cards ? 0.85 : 0.7)), behavior: 'smooth' })

  const fade = cards ? undefined
    : edges.left && edges.right ? 'linear-gradient(to right, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%)'
    : edges.left ? 'linear-gradient(to right, transparent 0, #000 40px)'
    : edges.right ? 'linear-gradient(to right, #000 calc(100% - 40px), transparent 100%)' : undefined

  return (
    <div className={cn('relative min-w-0', className)}>
      <div
        ref={ref}
        onScroll={update}
        role={role ?? (label ? 'group' : undefined)}
        aria-label={label}
        className={cn('scroll-x flex flex-nowrap', cards ? 'scroll-x-cards items-stretch' : 'items-center', innerClassName)}
        style={{ maskImage: fade, WebkitMaskImage: fade }}
      >
        {children}
      </div>
      {edges.left && (
        <button type="button" onClick={() => by(-1)} aria-label="Scroll left" className={cn('scroll-row-btn', cards ? 'scroll-row-btn-lg left-1' : 'left-0')}>
          <ChevronLeft size={cards ? 18 : 15} />
        </button>
      )}
      {edges.right && (
        <button type="button" onClick={() => by(1)} aria-label="Scroll right" className={cn('scroll-row-btn', cards ? 'scroll-row-btn-lg right-1' : 'right-0')}>
          <ChevronRight size={cards ? 18 : 15} />
        </button>
      )}
    </div>
  )
}
