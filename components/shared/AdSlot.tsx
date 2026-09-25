'use client'
import { useEffect, useRef, useState } from 'react'
import { adAPI } from '@/lib/api'
import type { PublicAd } from '@/types'

// One request per placement per page view, shared by every slot on the page.
const cache = new Map<string, Promise<PublicAd[]>>()
const loadAds = (placement: 'listings' | 'details') => {
  if (!cache.has(placement)) {
    cache.set(placement, adAPI.serve(placement).then(r => (r.data.data || []) as PublicAd[]).catch(() => { cache.delete(placement); return [] }))
  }
  return cache.get(placement)!
}
// An ad is counted once per page view, the first time it's actually on screen.
const counted = new Set<string>()

const ROTATE_MS = 5000

// Banner ad space (Ads manager, admin). `tall` = side column (300×600 art), `wide` = in-page strip / phones
// (1200×300 art); each falls back to the other artwork if an ad only has one. Several ads rotate automatically.
export default function AdSlot({ placement, variant, className = '' }: {
  placement: 'listings' | 'details'
  variant: 'tall' | 'wide'
  className?: string
}) {
  const [ads, setAds] = useState<PublicAd[]>([])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [visible, setVisible] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    loadAds(placement).then(list => { if (alive) setAds(list.filter(a => a.imageTall || a.imageWide)) })
    return () => { alive = false }
  }, [placement])

  // Rotate while on screen and not hovered.
  useEffect(() => {
    if (ads.length < 2 || paused || !visible) return
    const t = setInterval(() => setIndex(i => (i + 1) % ads.length), ROTATE_MS)
    return () => clearInterval(t)
  }, [ads.length, paused, visible])

  // Track whether the slot is on screen (at least half of it).
  useEffect(() => {
    const el = box.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [ads.length])

  // Count the ad currently showing, once, when it's seen.
  const current = ads[index % Math.max(ads.length, 1)]
  useEffect(() => {
    if (!visible || !current || counted.has(current._id)) return
    counted.add(current._id)
    adAPI.impressions([current._id]).catch(() => {})
  }, [visible, current])

  if (!ads.length) return null
  const art = (a: PublicAd) => (variant === 'tall' ? a.imageTall || a.imageWide : a.imageWide || a.imageTall)!

  return (
    <div
      ref={box}
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ aspectRatio: variant === 'tall' ? '1 / 2' : '4 / 1', background: 'var(--bg-alt)', border: '1px solid var(--border)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Advertisement"
    >
      {ads.map((a, i) => (
        <a
          key={a._id}
          href={adAPI.clickUrl(a._id)}
          target="_blank"
          rel="sponsored noopener"
          aria-hidden={i !== index}
          tabIndex={i === index ? 0 : -1}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === index ? 1 : 0, pointerEvents: i === index ? 'auto' : 'none' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={art(a)} alt={a.title} loading={i === 0 ? 'eager' : 'lazy'} className="w-full h-full object-cover" />
        </a>
      ))}

      <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
        style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}>Ad</span>

      {ads.length > 1 && (
        <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
          {ads.map((a, i) => (
            <button
              key={a._id}
              onClick={() => setIndex(i)}
              aria-label={`Show ad ${i + 1}`}
              className="h-1.5 rounded-full transition-all"
              style={{ width: i === index ? 16 : 6, background: i === index ? '#fff' : 'rgba(255,255,255,0.55)', boxShadow: '0 0 3px rgba(0,0,0,0.4)' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
