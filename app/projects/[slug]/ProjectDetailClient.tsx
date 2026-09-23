'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, MapPin, CalendarClock, Wallet, BedDouble, Bath, Home, ShieldCheck, Phone, Building2, MessageCircleHeart, Share2,
  TrainFront, GraduationCap, ShoppingBag, Landmark as LandmarkIcon, Plane, Search, Loader2, Navigation, Maximize2, Tag, Clock, X,
} from 'lucide-react'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import ProjectInterestModal from '@/components/buyer/ProjectInterestModal'
import { projectAPI } from '@/lib/api'
import { formatPrice, cn, timeAgo } from '@/lib/utils'
import { AMENITY_META } from '@/lib/amenities'
import { haversineKm, formatDistanceKm, geocodePlace, type GeocodeResult } from '@/lib/distance'
import type { Project } from '@/types'
import toast from 'react-hot-toast'

// Custom-styled Google map, loaded client-side only (the Maps script needs `window`).
const LocationMap = dynamic(() => import('@/components/shared/LocationMap'), {
  ssr: false,
  loading: () => <div className="shimmer w-full h-full" />,
})

const STATUS_BADGE: Record<string, string> = {
  upcoming: 'badge-blue', under_construction: 'badge-teal', ready: 'badge-green', sold_out: 'badge-gray',
}

const LAND_DEPARTMENT: Record<string, string> = {
  'Dubai':      'Dubai Land Department (DLD)',
  'Abu Dhabi':  'Dept. of Municipalities & Transport',
  'Sharjah':    'Sharjah Real Estate Reg. Dept. (SRERD)',
}
function landDepartmentFor(emirate?: string): string {
  if (!emirate) return 'Dubai Land Department (DLD)'
  return LAND_DEPARTMENT[emirate] || `${emirate} Land Department`
}

const LANDMARK_ICON: Record<string, any> = {
  metro: TrainFront, school: GraduationCap, mall: ShoppingBag, landmark: LandmarkIcon, airport: Plane,
}
const LANDMARK_LABEL: Record<string, string> = {
  metro: 'Metro Stations', school: 'Schools', mall: 'Malls', landmark: 'Landmarks', airport: 'Airports',
}

// Tabs are built from whatever floor-plan entries the admin added — no
// hardcoded "Ground/First/Second" floor list, and switching tabs is plain
// component state, never a URL/query-param change.
function FloorPlanTabs({ floorPlans }: { floorPlans: NonNullable<Project['floorPlans']> }) {
  const [active, setActive] = useState(0)
  const fp = floorPlans[active]

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap mb-5">
        {floorPlans.map((f, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200"
            style={{
              background:  active === i ? 'var(--grad)' : 'transparent',
              color:       active === i ? '#fff' : 'var(--text-mid)',
              border:      active === i ? 'none' : '1px solid var(--border)',
              boxShadow:   active === i ? '0 6px 16px rgba(203,1,1,0.30)' : 'none',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="relative w-full h-72 sm:h-96" style={{ background: 'var(--bg-alt)' }}>
          <Image src={fp.image} alt={fp.label} fill className="object-contain p-4" sizes="(max-width:768px)100vw,700px" />
        </div>
        <div className="p-5 flex flex-wrap items-center gap-4" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="font-semibold text-sm flex-shrink-0" style={{ color: 'var(--text)' }}>{fp.label}</p>
          {fp.bedrooms && <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-mid)' }}><BedDouble size={13} style={{ color: 'var(--teal)' }} />{fp.bedrooms}</span>}
          {fp.size && <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-mid)' }}><Maximize2 size={13} style={{ color: 'var(--teal)' }} />{fp.size}</span>}
          {fp.price && <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: 'var(--teal)' }}><Tag size={13} />{formatPrice(fp.price)}</span>}
        </div>
      </div>
    </div>
  )
}

/* ── Nearby distances + a free-text "how far is X" calculator ── */
function NearbyDistances({ project }: { project: Project }) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [customResult, setCustomResult] = useState<{ place: GeocodeResult; km: number } | null>(null)

  const coords = project.coordinates
  const landmarks = project.landmarks || []

  const grouped = landmarks.reduce((acc, lm) => {
    (acc[lm.category] ||= []).push(lm)
    return acc
  }, {} as Record<string, typeof landmarks>)

  const calculateCustom = async () => {
    if (!query.trim()) return
    if (!coords) { toast.error("This project's exact location isn't set yet"); return }
    setSearching(true)
    setCustomResult(null)
    try {
      const results = await geocodePlace(query.trim())
      if (results.length === 0) { toast.error('Place not found'); return }
      const place = results[0]
      const km = haversineKm(coords.lat, coords.lng, place.lat, place.lng)
      setCustomResult({ place, km })
    } catch {
      toast.error('Failed to calculate distance — try again')
    } finally {
      setSearching(false)
    }
  }

  if (!coords && landmarks.length === 0) return null

  return (
    <>
      {coords && (
        <div className="rounded-xl overflow-hidden mb-6" style={{ height: 320, border: '1px solid var(--border)' }}>
          <LocationMap
            lat={coords.lat}
            lng={coords.lng}
            zoom={14}
            landmarks={landmarks.map(l => ({ lat: l.lat, lng: l.lng, title: l.name }))}
          />
        </div>
      )}

      {/* Custom distance calculator */}
      {coords && (
        <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--bg-alt)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Navigation size={15} style={{ color: 'var(--teal)' }} />
            <h4 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Calculate Distance to Any Place</h4>
          </div>
          <div className="flex gap-2">
            <div className="input-glass flex-1 flex items-center gap-2 h-11 px-3 rounded-xl">
              <Search size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && calculateCustom()}
                placeholder="e.g. Dubai Mall, DXB Airport, JBR Beach…"
                className="bg-transparent flex-1 text-sm outline-none min-w-0"
                style={{ color: 'var(--text)' }}
              />
            </div>
            <button onClick={calculateCustom} disabled={searching} className="btn-primary btn-sm flex-shrink-0 gap-1.5">
              {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
              Calculate
            </button>
          </div>
          {customResult && (
            <div className="mt-3 flex items-center justify-between gap-3 p-3 rounded-xl" style={{ background: 'rgba(203,1,1,0.08)' }}>
              <p className="text-xs truncate" style={{ color: 'var(--text-mid)' }}>{customResult.place.label}</p>
              <p className="text-sm font-bold flex-shrink-0" style={{ color: 'var(--teal)' }}>{formatDistanceKm(customResult.km)}</p>
            </div>
          )}
        </div>
      )}

      {/* Pre-set landmarks, grouped by category */}
      {Object.keys(grouped).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {Object.entries(grouped).map(([category, items]) => {
            const Icon = LANDMARK_ICON[category] || LandmarkIcon
            const withDistance = items
              .map(lm => ({ ...lm, km: coords ? haversineKm(coords.lat, coords.lng, lm.lat, lm.lng) : null }))
              .sort((a, b) => (a.km ?? 0) - (b.km ?? 0))
            return (
              <div key={category} className="rounded-xl p-4" style={{ background: 'var(--bg-alt)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={14} style={{ color: 'var(--teal)' }} />
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-mid)' }}>{LANDMARK_LABEL[category] || category}</p>
                </div>
                <div className="space-y-2">
                  {withDistance.map(lm => (
                    <div key={lm.name} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate" style={{ color: 'var(--text-mid)' }}>{lm.name}</span>
                      {lm.km !== null && <span className="font-semibold flex-shrink-0" style={{ color: 'var(--text)' }}>{formatDistanceKm(lm.km)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

// A compact single row of chips, with a "+N More" pill that opens the full
// grid in a modal instead of pushing the row onto a second line.
function AmenitiesSection({ amenities }: { amenities: Record<string, boolean> }) {
  const [showAll, setShowAll] = useState(false)
  const keys = Object.entries(amenities).filter(([, v]) => v).map(([k]) => k)
  const VISIBLE = 6
  const visible = keys.slice(0, VISIBLE)
  const hiddenCount = keys.length - visible.length

  const chip = (key: string, fixed: boolean) => {
    const meta = AMENITY_META[key]
    const Icon = meta?.icon || Building2
    return (
      <div
        key={key}
        className={cn('flex items-center gap-2 px-3 py-2 rounded-xl', fixed && 'flex-shrink-0 whitespace-nowrap')}
        style={{ background: 'var(--bg-alt)' }}
      >
        <Icon size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
        <span className="text-sm" style={{ color: 'var(--text-mid)' }}>{meta?.label || key}</span>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {visible.map(k => chip(k, true))}
        {hiddenCount > 0 && (
          <button onClick={() => setShowAll(true)} className="btn-outline btn-sm flex-shrink-0 whitespace-nowrap">
            +{hiddenCount} More
          </button>
        )}
      </div>

      <AnimatePresence>
        {showAll && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowAll(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="card w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>All Amenities & Features</h3>
                <button onClick={() => setShowAll(false)} className="btn-ghost btn-sm p-2"><X size={14} /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {keys.map(k => chip(k, false))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Matches Property detail page's icon-chip fact tile exactly (see
// PropertyDetailClient.tsx's "Property details" / "Regulatory information"
// grids) so both listing types read as one consistent design system.
function Fact({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.10)', border: '1px solid rgba(203,1,1,0.20)' }}>
        <Icon size={14} style={{ color: 'var(--teal)' }} />
      </div>
      <div>
        <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text)' }}>{value}</p>
      </div>
    </div>
  )
}

export default function ProjectDetailClient({ project }: { project: Project }) {
  const [related, setRelated] = useState<Project[]>([])
  const [interestOpen, setInterestOpen] = useState(false)
  const [activeImage, setActiveImage] = useState(project.coverImage || project.images[0]?.url || '')
  const [showStickyBar, setShowStickyBar] = useState(false)
  const gallery = [project.coverImage, ...project.images.map(i => i.url)].filter((v, i, arr): v is string => !!v && arr.indexOf(v) === i)

  // Mobile-friendly sticky lead-gen bar — appears once the buyer scrolls
  // past the sidebar's own CTA card, same trigger as the Property detail page.
  useEffect(() => {
    const onScroll = () => setShowStickyBar(window.scrollY > 480)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    projectAPI.getAll({ area: project.area, limit: 4 })
      .then(r => { if (r.data.success) setRelated((r.data.data.data || []).filter((p: Project) => p._id !== project._id).slice(0, 3)) })
      .catch(() => {})
  }, [project.area, project._id])

  const handover = [project.handoverQuarter, project.handoverYear].filter(Boolean).join(' ') || 'TBA'

  const share = async () => {
    projectAPI.trackShare(project._id).catch(() => {})
    const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://distressdealsuae.com/projects/${project.slug}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: project.title, url: shareUrl }) } catch { /* user cancelled — not an error */ }
      return
    }
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied')
  }

  return (
    <div className="page overflow-x-hidden">
      <Navbar />

      <div className="wrap py-4">
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Link href="/" className="hover:opacity-80 transition-opacity">Home</Link>
          <span>/</span>
          <Link href="/projects" className="hover:opacity-80 transition-opacity">Projects</Link>
          <span>/</span>
          <span style={{ color: 'var(--teal)' }} className="truncate max-w-xs">{project.title}</span>
        </div>
      </div>

      <div className="wrap pb-20">
        {/* Gallery */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="relative w-full h-64 md:h-[420px] rounded-3xl overflow-hidden mb-3" style={{ background: 'var(--bg-alt)' }}>
            {activeImage ? (
              <Image src={activeImage} alt={project.title} fill priority className="object-cover" sizes="(max-width:1024px)100vw,1024px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Building2 size={48} style={{ color: 'var(--teal)', opacity: 0.3 }} /></div>
            )}
            <span className={cn('badge absolute top-4 left-4 text-xs capitalize', STATUS_BADGE[project.status])}>
              {project.status.replace('_', ' ')}
            </span>
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {gallery.map((url, i) => (
                <button key={i} onClick={() => setActiveImage(url)}
                  className="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-opacity"
                  style={{ opacity: activeImage === url ? 1 : 0.55, border: activeImage === url ? '2px solid var(--teal)' : '2px solid transparent' }}>
                  <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_320px] gap-12">
          <article className="min-w-0">
            <Link href={`/developers/${project.developer.toLowerCase().trim().replace(/\s+/g, '-')}`} className="inline-flex items-center gap-2 mb-1 group">
              {project.developerLogo && (
                <span className="w-6 h-6 rounded-md overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-alt)' }}>
                  <Image src={project.developerLogo} alt={project.developer} width={24} height={24} className="object-cover w-full h-full" />
                </span>
              )}
              <span className="text-sm font-semibold group-hover:underline" style={{ color: 'var(--teal)' }}>{project.developer}</span>
            </Link>
            <h1 className="heading-lg mb-2 leading-tight">{project.title}</h1>
            <div className="flex items-center gap-3 flex-wrap mb-8">
              <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <MapPin size={13} style={{ color: 'var(--teal)' }} />{project.area}, {project.city}
              </p>
              {project.referenceId && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-alt)', color: 'var(--text-muted)' }}>
                  Ref. {project.referenceId}
                </span>
              )}
            </div>

            {/* Price + Stats — same horizontal layout as the Property
                detail page's own price+stats card. */}
            <div className="card p-5 flex flex-wrap items-center gap-6 mb-5">
              <div>
                <p className="text-xs mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Starting Price</p>
                <p className="text-3xl font-bold grad-text">{formatPrice(project.priceFrom)}</p>
                {project.priceTo && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>up to {formatPrice(project.priceTo)}</p>}
              </div>
              <div className="h-12 w-px hidden sm:block" style={{ background: 'var(--border)' }} />
              {[
                project.type &&      { icon: Home,      val: project.type.charAt(0).toUpperCase() + project.type.slice(1), label: 'Type' },
                project.bedrooms &&  { icon: BedDouble,  val: project.bedrooms,  label: 'Bedrooms' },
                project.bathrooms && { icon: Bath,       val: project.bathrooms, label: 'Bathrooms' },
                project.sizeRange && { icon: Maximize2,  val: project.sizeRange, label: 'Floor Area' },
              ].filter(Boolean).map(stat => {
                const { icon: Icon, val, label } = stat as { icon: any; val: string; label: string }
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.10)', border: '1px solid rgba(203,1,1,0.20)' }}>
                      <Icon size={15} style={{ color: 'var(--teal)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{val}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-5">
              {/* Overview */}
              {project.description && (
                <div className="card p-6">
                  <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>About This Project</h3>
                  <div className="rich-content text-sm leading-relaxed" style={{ color: 'var(--text-mid)' }}
                    dangerouslySetInnerHTML={{ __html: project.description }} />
                </div>
              )}

              {/* Project details — same label/value grid as Property's
                  "Property details" card. A project spans many unit types,
                  so Bedrooms/Bathrooms/Floor Area read as ranges here. */}
              <div className="card p-6">
                <h3 className="font-semibold mb-5" style={{ color: 'var(--text)' }}>Project details</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5">
                  {[
                    { icon: Home,        l: 'Property Type', v: project.type },
                    { icon: Maximize2,   l: 'Floor Area',    v: project.sizeRange },
                    { icon: BedDouble,   l: 'Bedrooms',      v: project.bedrooms },
                    { icon: Bath,        l: 'Bathrooms',     v: project.bathrooms },
                    { icon: CalendarClock, l: 'Handover',    v: handover },
                    { icon: Wallet,      l: 'Payment Plan',  v: project.paymentPlan },
                    { icon: Building2,   l: 'Developer',     v: project.developer },
                  ].filter(({ v }) => v).map(({ icon: Icon, l, v }) => (
                    <Fact key={l} icon={Icon} label={l} value={v as string} />
                  ))}
                </div>
              </div>

              {/* Amenities & Features — one row, "+N More" opens the rest in a modal */}
              {project.amenities && Object.values(project.amenities).some(Boolean) && (
                <div className="card p-6">
                  <h3 className="font-semibold mb-5" style={{ color: 'var(--text)' }}>Amenities & Features</h3>
                  <AmenitiesSection amenities={project.amenities} />
                </div>
              )}

              {/* Floor Plans */}
              {project.floorPlans && project.floorPlans.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-semibold mb-5" style={{ color: 'var(--text)' }}>Floor Plans</h3>
                  <FloorPlanTabs floorPlans={project.floorPlans} />
                </div>
              )}

              {/* Master Plan */}
              {project.masterPlan?.image && (
                <div className="card p-6">
                  <h3 className="font-semibold mb-5" style={{ color: 'var(--text)' }}>Master Plan</h3>
                  <div className="rounded-xl overflow-hidden mb-3" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                    <div className="relative w-full" style={{ height: 420 }}>
                      <Image src={project.masterPlan.image} alt="Master plan" fill className="object-contain p-3" sizes="(max-width:1024px)100vw,800px" />
                    </div>
                  </div>
                  {project.masterPlan.description && (
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-mid)' }}>{project.masterPlan.description}</p>
                  )}
                </div>
              )}

              {/* Location & Nearby */}
              {(project.coordinates || (project.landmarks && project.landmarks.length > 0)) && (
                <div className="card p-6">
                  <h3 className="font-semibold mb-5 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <MapPin size={16} style={{ color: 'var(--teal)' }} /> Location & Nearby
                  </h3>
                  <NearbyDistances project={project} />
                </div>
              )}

              {/* Regulatory information — Bayut-style, incl. DLD permit QR,
                  kept last since it's reference/compliance info rather than
                  something that helps decide on the project itself. */}
              <div className="card p-6">
                <h3 className="font-semibold mb-5" style={{ color: 'var(--text)' }}>Regulatory information</h3>
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    {[
                      { icon: Tag,         l: 'Ref ID',         v: project.referenceId },
                      { icon: Clock,       l: 'Listed',         v: timeAgo(project.createdAt) },
                      { icon: MapPin,      l: 'Zone name',      v: project.area },
                      { icon: Building2,   l: 'Land Department', v: landDepartmentFor(project.emirate) },
                      { icon: ShieldCheck, l: 'Permit No.',     v: project.permitNumber },
                    ].filter(({ v }) => v).map(({ icon: Icon, l, v }) => (
                      <Fact key={l} icon={Icon} label={l} value={v as string} />
                    ))}
                  </div>
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    {project.permitQrImage ? (
                      <img
                        src={project.permitQrImage}
                        alt="DLD Permit QR code" width={90} height={90} className="rounded-lg object-cover"
                        style={{ border: '1px solid var(--border)' }}
                      />
                    ) : project.permitNumber ? (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(project.permitNumber)}`}
                        alt="DLD Permit QR code" width={90} height={90} className="rounded-lg"
                        style={{ border: '1px solid var(--border)' }}
                      />
                    ) : (
                      <div className="w-[90px] h-[90px] rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-alt)', border: '1px dashed var(--border)' }}>
                        <LandmarkIcon size={22} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                      </div>
                    )}
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>DLD Permit</p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar — lead-generation only; the rest of the key info lives
              in the main column, same split as the Property detail page. */}
          <aside>
            <div className="sticky" style={{ top: 96 }}>
              <div className="card p-6" style={{ borderColor: 'rgba(203,1,1,0.25)', background: 'linear-gradient(180deg, rgba(203,1,1,0.06), var(--surface) 45%)' }}>
                <div className="text-center mb-6">
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Starting Price</p>
                  <p className="text-3xl font-bold grad-text">{formatPrice(project.priceFrom)}</p>
                </div>
                <button onClick={() => setInterestOpen(true)} className="btn-primary w-full py-4 text-base mb-3">
                  <MessageCircleHeart size={16} /> I'm Interested
                </button>
                <a href="tel:+97144000000" className="btn-outline w-full py-3.5 mb-3 gap-2">
                  <Phone size={16} style={{ color: 'var(--teal)' }} /> Call Our Team
                </a>
                <button onClick={share} className="btn-ghost w-full py-3.5 gap-2">
                  <Share2 size={16} /> Share
                </button>
              </div>
            </div>
          </aside>
        </div>

        <Link href="/projects" className="btn-ghost btn-sm gap-2 mt-10">
          <ArrowLeft size={14} /> Back to Projects
        </Link>
      </div>

      {related.length > 0 && (
        <section className="section pt-0">
          <div className="wrap">
            <h2 className="heading-md mb-8">More in <span className="grad-text">{project.area}</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((r, i) => (
                <motion.div key={r._id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <Link href={`/projects/${r.slug}`}>
                    <div className="card-hover h-full flex flex-col p-5">
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--teal)' }}>{r.developer}</p>
                      <h3 className="font-semibold text-sm mb-2 leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>{r.title}</h3>
                      <p className="text-xs mt-auto" style={{ color: 'var(--text-muted)' }}>From {formatPrice(r.priceFrom)}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Sticky bottom contact bar ──────────────────── */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-0 inset-x-0 z-40"
            style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.10)', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
          >
            <div className="wrap flex items-center gap-3 py-3">
              <div className="hidden sm:block flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{project.title}</p>
                <p className="text-sm font-bold grad-text">{formatPrice(project.priceFrom)}</p>
              </div>
              <a href="tel:+97144000000" className="btn-outline p-3 flex-shrink-0" aria-label="Call our team">
                <Phone size={17} style={{ color: 'var(--teal)' }} />
              </a>
              <button onClick={share} className="btn-outline p-3 flex-shrink-0" aria-label="Share">
                <Share2 size={17} style={{ color: 'var(--text-mid)' }} />
              </button>
              <button onClick={() => setInterestOpen(true)} className="btn-primary flex-1 sm:flex-initial py-3 px-6">
                <MessageCircleHeart size={15} />
                I'm Interested
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />

      <ProjectInterestModal
        projectId={project._id}
        projectTitle={project.title}
        open={interestOpen}
        onClose={() => setInterestOpen(false)}
      />
    </div>
  )
}
