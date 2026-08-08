'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Building2, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ImageSlider({
  images, alt, sizes, rounded,
}: { images?: { url: string }[]; alt: string; sizes: string; rounded?: boolean }) {
  const [idx, setIdx] = useState(0)
  const [err, setErr] = useState(false)
  const list = images && images.length > 0 ? images : []

  useEffect(() => { setErr(false) }, [idx])

  if (list.length === 0 || err) {
    return (
      <div className={cn('absolute inset-0 flex items-center justify-center', rounded && 'rounded-2xl')} style={{ background: 'var(--bg-alt)' }}>
        <Building2 size={40} style={{ color: 'var(--text-muted)', opacity: 0.35 }} />
      </div>
    )
  }

  const go = (e: React.MouseEvent, dir: 1 | -1) => {
    e.preventDefault(); e.stopPropagation()
    setIdx(i => (i + dir + list.length) % list.length)
  }

  return (
    <>
      <Image
        src={list[idx].url}
        alt={alt}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        onError={() => setErr(true)}
        sizes={sizes}
      />

      {list.length > 1 && (
        <>
          <button
            onClick={e => go(e, -1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            style={{ background: 'rgba(0,0,0,0.50)' }}
            aria-label="Previous image"
          >
            <ChevronLeft size={14} className="text-white" />
          </button>
          <button
            onClick={e => go(e, 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            style={{ background: 'rgba(0,0,0,0.50)' }}
            aria-label="Next image"
          >
            <ChevronRight size={14} className="text-white" />
          </button>
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {list.map((_, i) => (
              <span
                key={i}
                className="rounded-full transition-all"
                style={{ width: i === idx ? 14 : 5, height: 5, background: i === idx ? '#fff' : 'rgba(255,255,255,0.5)' }}
              />
            ))}
          </div>
        </>
      )}
    </>
  )
}
