'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

// Full-screen photo viewer: arrows / keyboard (← → Esc) / swipe, and a thumbnail strip to jump around.
export default function ImageLightbox({ images, start = 0, title, onClose }: {
  images: string[]; start?: number; title?: string; onClose: () => void
}) {
  const [i, setI] = useState(start)
  const touchX = useRef<number | null>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const go = (d: number) => setI(x => (x + d + images.length) % images.length)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the current thumbnail in view.
  useEffect(() => {
    stripRef.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [i])

  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[120] flex flex-col" style={{ background: 'rgba(8,8,10,0.96)' }} role="dialog" aria-modal="true" aria-label={title ? `${title} photos` : 'Photos'}>
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 text-white">
        <p className="text-sm truncate pr-4"><span className="font-semibold">{i + 1}</span> / {images.length}{title && <span className="opacity-60"> · {title}</span>}</p>
        <button onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10"><X size={20} /></button>
      </div>

      <div
        className="relative flex-1 min-h-0 select-none"
        onTouchStart={e => { touchX.current = e.touches[0].clientX }}
        onTouchEnd={e => {
          if (touchX.current === null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
          touchX.current = null
        }}
      >
        <Image key={images[i]} src={images[i]} alt={title || ''} fill priority sizes="100vw" className="object-contain" />
        {images.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous photo"
              className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-white bg-black/40 hover:bg-black/60">
              <ChevronLeft size={22} />
            </button>
            <button onClick={() => go(1)} aria-label="Next photo"
              className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-white bg-black/40 hover:bg-black/60">
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div ref={stripRef} className="flex gap-2 overflow-x-auto px-4 sm:px-6 py-3" style={{ scrollbarWidth: 'none' }}>
          {images.map((src, n) => (
            <button key={src} data-i={n} onClick={() => setI(n)} aria-label={`Photo ${n + 1}`}
              className="relative w-20 h-14 flex-shrink-0 rounded-lg overflow-hidden transition-opacity"
              style={{ opacity: n === i ? 1 : 0.45, outline: n === i ? '2px solid #fff' : 'none', outlineOffset: 1 }}>
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  )
}
