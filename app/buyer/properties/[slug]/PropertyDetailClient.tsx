'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Bed, Bath, Maximize2, Car, Building2,
  Heart, Share2, GitCompare, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X,
  CheckCircle2, Phone, MessageCircle, Send,
  Star, Shield, Award, ZoomIn, Video,
  Clock, Building, Waves, Dumbbell, ConciergeBell, Sofa, Calendar, Layers, Tag,
  ShieldCheck, Smartphone, Snowflake, DoorClosed, BookOpen,
  Flame, PawPrint, Baby, Sailboat, Flag, Wifi, Thermometer,
  Shirt, BedDouble, Sparkles, Link2, TrendingUp as TrendUpIcon,
  Compass, Flag as ReportIcon, Loader2, Landmark, FileText, Map as MapIcon, Link as LinkIcon,
  Wallet, Hash,
} from 'lucide-react'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import PropertyCard from '@/components/buyer/PropertyCard'
import RecentlyViewedCard from '@/components/buyer/RecentlyViewedCard'
import RentalBadge from '@/components/buyer/RentalBadge'
import { rentalLabel } from '@/lib/rental'
import LeadModal from '../../LeadModal'
import { propertyAPI } from '@/lib/api'
import { COMPANY_PHONE_DISPLAY, telHref, whatsappHref } from '@/lib/contact'
import { addRecentlyViewed } from '@/lib/recentlyViewed'
import { AMENITY_META, AMENITY_GROUPS } from '@/lib/amenities'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useCompareStore } from '@/store/compareStore'
import { useAuthStore } from '@/store/authStore'
import { formatPrice, formatArea, timeAgo, cn, rentSuffix, rentPeriodLabel } from '@/lib/utils'
import type { Property } from '@/types'
import toast from 'react-hot-toast'

const TEAL = 'var(--teal)'

const NEARBY_FACT_FIELDS: { key: keyof Property['amenities']; l: string }[] = [
  { key: 'view',                  l: 'View' },
  { key: 'petPolicy',             l: 'Pet Policy' },
  { key: 'otherRooms',            l: 'Other Rooms' },
  { key: 'otherFacilities',       l: 'Other Facilities' },
  { key: 'nearbySchools',         l: 'Nearby Schools' },
  { key: 'nearbyHospitals',       l: 'Nearby Hospitals' },
  { key: 'nearbyShoppingMalls',   l: 'Nearby Shopping Malls' },
  { key: 'nearbyPublicTransport', l: 'Nearby Public Transport' },
  { key: 'otherNearbyPlaces',     l: 'Other Nearby Places' },
]

const USEFUL_LINKS = [
  { href: '/buyer/properties', label: 'Browse All Properties' },
  { href: '/buyer/properties?completion=off_plan', label: 'Off-Plan Projects' },
  { href: '/seller', label: 'Sell Your Property' },
  { href: '/blog', label: 'Buying Guides & Blog' },
  { href: '/about', label: 'About Us' },
]

const POPULAR_AREAS = [
  'Downtown Dubai', 'Dubai Marina', 'Business Bay', 'Palm Jumeirah',
  'JVC', 'Dubai Hills Estate', 'JBR', 'Arabian Ranches', 'Al Barsha', 'Jumeirah',
]

const REPORT_REASONS = [
  'Incorrect information', 'Already sold or rented', 'Fraud or scam', 'Duplicate listing', 'Other',
]

// Custom-styled Google map, loaded client-side only (the Maps script needs `window`).
const LocationMap = dynamic(() => import('@/components/shared/LocationMap'), {
  ssr: false,
  loading: () => <div className="shimmer w-full h-full" />,
})

export default function PropertyDetailClient({ property }: { property: Property }) {
  const router = useRouter()
  const [similar,  setSimilar]      = useState<Property[]>([])
  const [recommended, setRecommended] = useState<Property[]>([])
  const [forYou,   setForYou]       = useState<Property[]>([])
  const [imgIdx,   setImgIdx]       = useState(0)
  const [lightbox, setLightbox]     = useState(false)
  const [leadOpen, setLeadOpen]     = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [tab,      setTab]          = useState<'overview'|'features'>('overview')
  const [descExpanded, setDescExpanded] = useState(false)
  const [showArabicDesc, setShowArabicDesc] = useState(false)
  const [descOverflows, setDescOverflows] = useState(false)
  const descRef = useRef<HTMLDivElement>(null)
  const DESC_COLLAPSED_HEIGHT = 260

  const { isAuthenticated }             = useAuthStore()
  const { toggleFavorite, isFavorite }  = useFavoritesStore()
  const { addToCompare, isInCompare }   = useCompareStore()

  // Scroll-spy: all three sections render in one column now (not swapped),
  // the tab bar just jumps to / highlights whichever is in view.
  const SCROLL_OFFSET = 128 // fixed navbar (64px) + sticky tab bar (~64px)
  const TAB_STICKY_TOP = 64 // must match the tab bar's own `top` sticky offset
  const overviewRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const tabNavRef   = useRef<HTMLDivElement>(null)
  const sectionRefs = { overview: overviewRef, features: featuresRef } as const
  const [tabStuck, setTabStuck] = useState(false)

  const goToSection = (t: 'overview'|'features') => {
    setTab(t)
    const el = sectionRefs[t].current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET
    window.scrollTo({ top, behavior: 'smooth' })
  }

  useEffect(() => {
    const onScroll = () => {
      const positions = (['overview','features'] as const)
        .map(t => ({ t, top: sectionRefs[t].current?.getBoundingClientRect().top ?? Infinity }))
        .filter(p => p.top - SCROLL_OFFSET <= 1)
      if (positions.length > 0) {
        const current = positions.reduce((a, b) => (b.top > a.top ? b : a))
        setTab(current.t)
      }
      // The tab bar is "stuck" once its own top has settled at the sticky
      // offset — square off its top corners only for that flush-with-the-
      // navbar state, not while it's still sitting inline in the page.
      setTabStuck((tabNavRef.current?.getBoundingClientRect().top ?? Infinity) <= TAB_STICKY_TOP)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property._id])

  // View tracking — fires once per mount, using the server-provided property.
  useEffect(() => {
    propertyAPI.trackView(property._id).catch(() => {})
    addRecentlyViewed({
      slug: property.slug,
      title: property.title,
      image: property.images?.[0]?.url,
      price: property.price,
      area: property.location?.area,
      listingType: property.listingType,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property._id])

  useEffect(() => {
    propertyAPI.getSimilar(property.slug)
      .then(r => { if (r.data.success) setSimilar(r.data.data) })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.slug])

  // Other units in the same development — only fetched once we know the
  // project name.
  useEffect(() => {
    if (!property.projectName) { setRecommended([]); return }
    propertyAPI.getAll({ project: property.projectName, limit: 4 })
      .then(r => { if (r.data.success) setRecommended((r.data.data.data || []).filter((p: Property) => p._id !== property._id)) })
      .catch(() => {})
  }, [property.projectName, property._id])

  // "Recommended for you" — a broader, popularity-based row shown at the
  // very bottom of the page, independent of area/project matching.
  useEffect(() => {
    propertyAPI.getAll({ sortBy: 'popular', limit: 10 })
      .then(r => { if (r.data.success) setForYou((r.data.data.data || []).filter((p: Property) => p._id !== property._id)) })
      .catch(() => {})
  }, [property._id])

  // Only show the "Read More" toggle when the description actually overflows
  // the collapsed height — a short description shouldn't get a pointless button.
  useEffect(() => {
    if (descRef.current) {
      setDescOverflows(descRef.current.scrollHeight > DESC_COLLAPSED_HEIGHT + 8)
    }
  }, [property.description])

  const images  = property.images?.length > 0 ? property.images : [{ url: '', isPrimary: true, publicId: '', order: 0 }]
  const fav     = isFavorite(property._id)
  const inCmp   = isInCompare(property._id)
  const features = Object.entries(property.features || {}).filter(([, v]) => v)
  const agent = property.agent
  const coords = property.location.coordinates

  const submitReport = async () => {
    if (!isAuthenticated) { window.location.href = '/auth/login'; return }
    if (!reportReason) { toast.error('Please select a reason'); return }
    setReportSubmitting(true)
    try {
      await propertyAPI.report(property._id, { reason: reportReason, details: reportDetails })
      toast.success('Thanks — our team will review this listing')
      setReportOpen(false); setReportReason(''); setReportDetails('')
    } catch {
      toast.error('Failed to submit report')
    } finally {
      setReportSubmitting(false)
    }
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://www.distressdealsuae.com/buyer/properties/${property.slug}`
  // Buyers always reach the company line — it routes them to the right agent.
  const whatsappLink = whatsappHref(`Hi, I'm interested in "${property.title}"${property.referenceId ? ` (Ref ${property.referenceId})` : ''}: ${shareUrl}`)

  const share = async () => {
    propertyAPI.trackShare(property._id).catch(() => {})
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: property.title, url: shareUrl }) } catch { /* user cancelled — not an error */ }
      return
    }
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied')
  }

  const talkToMortgageExpert = () => {
    router.push(`/?mortgagePrice=${property.price}#mortgage-calculator`)
  }

  return (
    <div className="page">
      <Navbar />

      {/* ── Breadcrumb ─────────────────── */}
      <div className="wrap py-4">
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Link href="/" className="hover:opacity-80 transition-opacity">Home</Link>
          <span>/</span>
          <Link href="/buyer/properties" className="hover:opacity-80 transition-opacity">Properties</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-mid)' }}>{property.location.area}</span>
          <span>/</span>
          <span style={{ color: 'var(--teal)' }} className="truncate max-w-xs">{property.title}</span>
        </div>
      </div>

      <div className="wrap pb-20">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* ── Left: Media + Details ───── */}
          <div className="xl:col-span-2 space-y-6">

            {/* Image Gallery */}
            <div className="relative rounded-3xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {/* Main image */}
              <div className="relative h-[420px] md:h-[520px] group cursor-pointer" style={{ background: 'var(--bg-alt)' }}
                onClick={() => setLightbox(true)}>
                {images[imgIdx]?.url ? (
                  <Image src={images[imgIdx].url} alt={property.title} fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width:1200px)100vw,800px" priority />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Building2 size={64} style={{ color: 'var(--text-muted)', opacity: 0.25 }} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                {/* Zoom icon */}
                <div className="absolute top-4 right-4 w-9 h-9 rounded-xl glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn size={16} className="text-white" />
                </div>

                {/* Image counter */}
                <div className="absolute bottom-4 right-4 glass rounded-lg px-3 py-1.5 text-xs text-white/85">
                  {imgIdx + 1} / {images.length}
                </div>

                {/* Arrows */}
                {images.length > 1 && (
                  <>
                    <button onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + images.length) % images.length) }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100">
                      <ChevronLeft size={18} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % images.length) }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100">
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
            {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 p-2 overflow-x-auto scrollbar-hide !mt-0" >
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all"
                      style={{ borderColor: imgIdx === i ? 'var(--teal)' : 'transparent', opacity: imgIdx === i ? 1 : 0.6 }}>
                      {img.url ? (
                        <Image src={img.url} alt="" width={80} height={56} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--surface-alt)' }}>
                          <Building2 size={16} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

            {/* Title + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={cn('badge', property.listingType === 'sale' ? 'badge-teal' : 'badge-blue')}>
                    {property.listingType === 'sale' ? 'For Sale' : 'For Rent'}
                  </span>
                  {property.listingType === 'rent' && <RentalBadge property={property} className="!text-xs !px-2.5 !py-1" />}
                  {property.completion === 'off_plan' && <span className="badge badge-purple">Off-Plan</span>}
                  {property.isFeatured && (
                    <span className="badge" style={{ background: 'var(--grad)', color: '#fff', border: 'none' }}>
                      ✦ Featured
                    </span>
                  )}
                  {property.category && (
                    <span className="badge badge-gray capitalize gap-1">
                      <Building size={11} />{property.category}
                    </span>
                  )}
                  <span className="badge badge-gray capitalize">{property.type?.replace('_', ' ')}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold mb-1 leading-tight" style={{ color: 'var(--text)' }}>{property.title}</h1>
                {property.titleAr && (
                  <p dir="rtl" className="text-lg font-medium mb-3" style={{ color: 'var(--text-mid)' }}>{property.titleAr}</p>
                )}
                <div className="flex items-center gap-3 flex-wrap text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-2">
                    <MapPin size={14} style={{ color: 'var(--teal)' }} />
                    {property.location.area}, {property.location.city}
                  </span>
                  {property.referenceId && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-alt)', color: 'var(--text-muted)' }}>
                      Ref. {property.referenceId}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => { if (!isAuthenticated) { window.location.href='/auth/login'; return }; toggleFavorite(property._id) }}
                  className="btn-ghost p-2.5" style={fav ? { borderColor: 'rgba(244,63,94,0.35)', color: '#FB7185', background: 'rgba(244,63,94,0.06)' } : undefined}>
                  <Heart size={16} fill={fav ? 'currentColor' : 'none'} />
                </button>
                <button onClick={() => addToCompare(property)}
                  className="btn-ghost p-2.5" style={inCmp ? { borderColor: 'rgba(203,1,1,0.40)', color: 'var(--teal)', background: 'rgba(203,1,1,0.06)' } : undefined}>
                  <GitCompare size={16} />
                </button>
                <button onClick={share} className="btn-ghost p-2.5">
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            {/* Price + Stats */}
            <div className="card p-5 flex flex-wrap items-center gap-6">
              <div>
                <p className="text-xs mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Price</p>
                <p className="text-3xl font-bold grad-text">{formatPrice(property.price)}{rentSuffix(property)}</p>
                {property.pricePerSqft && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>AED {Math.round(property.pricePerSqft).toLocaleString()}/sqft</p>
                )}
              </div>
              <div className="h-12 w-px hidden sm:block" style={{ background: 'var(--border)' }} />
              {[
                { icon: Bed,      val: property.amenities.bedrooms > 0 ? `${property.amenities.bedrooms} Bed` : 'Studio', label: 'Bedrooms' },
                { icon: Bath,     val: `${property.amenities.bathrooms} Bath`,    label: 'Bathrooms' },
                { icon: Maximize2,val: `${formatArea(property.amenities.floorArea)} sqft`, label: 'Floor Area' },
                { icon: Car,      val: `${property.amenities.parkingSpaces} Parking`, label: 'Parking' },
              ].map(({ icon: Icon, val, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.10)', border: '1px solid rgba(203,1,1,0.20)' }}>
                    <Icon size={15} style={{ color: TEAL }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{val}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tab navigation + sections — sticks below the navbar once it
                reaches it, scroll-spies which section is active, and un-sticks
                naturally once you scroll past this whole block. */}
            <div>
              <div ref={tabNavRef} className="sticky z-30 flex gap-1 p-1 rounded-xl"
                style={{
                  top: TAB_STICKY_TOP, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
                  borderTopLeftRadius: tabStuck ? 0 : undefined, borderTopRightRadius: tabStuck ? 0 : undefined,
                }}>
                {(['overview','features'] as const).map(t => (
                  <button key={t} onClick={() => goToSection(t)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all capitalize"
                    style={tab === t ? { background: 'var(--grad)', color: '#fff' } : { color: 'var(--text-muted)' }}>
                    {t}
                  </button>
                ))}
              </div>

              <div className="space-y-5 mt-5">
                <div ref={overviewRef} id="section-overview" style={{ scrollMarginTop: SCROLL_OFFSET }} className="space-y-5">
                  <div className="card p-6">
                    <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>About This Property</h3>
                    <div className="relative overflow-hidden" style={{ maxHeight: descExpanded ? 'none' : DESC_COLLAPSED_HEIGHT }}>
                      <div ref={descRef} className="text-sm leading-relaxed rich-content" style={{ color: 'var(--text-mid)' }}
                        dangerouslySetInnerHTML={{ __html: property.description }} />
                      {!descExpanded && descOverflows && (
                        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                          style={{ background: 'linear-gradient(to top, var(--surface), transparent)' }} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {descOverflows && (
                        <button onClick={() => setDescExpanded(v => !v)} className="btn-ghost btn-sm gap-1.5">
                          {descExpanded ? <>Read Less <ChevronUp size={13} /></> : <>Read More <ChevronDown size={13} /></>}
                        </button>
                      )}
                      {property.descriptionAr && (
                        <button onClick={() => setShowArabicDesc(v => !v)} className="btn-ghost btn-sm gap-1.5">
                          {showArabicDesc ? 'Hide Arabic' : 'اقرأ بالعربية'}
                        </button>
                      )}
                    </div>
                    {showArabicDesc && property.descriptionAr && (
                      <p dir="rtl" className="text-sm leading-relaxed mt-3 pt-3" style={{ color: 'var(--text-mid)', borderTop: '1px solid var(--border-soft)' }}>
                        {property.descriptionAr}
                      </p>
                    )}
                  </div>

                  {/* Property details — Bayut-style label/value list */}
                  <div className="card p-6">
                    <h3 className="font-semibold mb-5" style={{ color: 'var(--text)' }}>Property details</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5">
                      {[
                        { icon: Building2, l: 'Property Type',  v: property.type?.replace('_',' ') },
                        { icon: Maximize2, l: 'Property Size',  v: property.amenities?.floorArea ? `${property.amenities.floorArea.toLocaleString()} sqft / ${Math.round(property.amenities.floorArea * 0.092903).toLocaleString()} sqm` : undefined },
                        { icon: Bed,       l: 'Bedrooms',       v: property.amenities?.bedrooms > 0 ? property.amenities.bedrooms : 'Studio' },
                        { icon: Bath,      l: 'Bathrooms',      v: property.amenities?.bathrooms || undefined },
                        { icon: Sofa,      l: 'Furnishing',     v: property.furnishing?.replace('_',' ') },
                        { icon: Calendar,  l: property.listingType === 'rent' ? 'Availability' : 'Available from', v: property.listingType === 'rent' ? rentalLabel(property) : property.completion === 'off_plan' ? 'On Completion' : 'Ready to Move' },
                        { icon: Hash,      l: 'Unit No.',       v: property.location?.unitNo },
                        { icon: Landmark,  l: 'Ownership',      v: property.ownershipStatus },
                        { icon: Tag,       l: 'Off-Plan Sale',  v: property.completion === 'off_plan' ? property.offPlanSaleType : undefined },
                        { icon: Calendar,  l: 'Completion Date',v: property.completion === 'off_plan' && property.expectedCompletionDate ? new Date(property.expectedCompletionDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : undefined },
                        { icon: Wallet,    l: 'Financing',      v: property.financingAvailable ? (property.financingInstitutionNames || 'Available') : undefined },
                        { icon: Building,  l: 'Developer',      v: property.developer },
                        { icon: Layers,    l: 'Project',        v: property.projectName },
                      ].filter(({ v }) => v).map(({ icon: Icon, l, v }) => (
                        <div key={l} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.10)', border: '1px solid rgba(203,1,1,0.20)' }}>
                            <Icon size={14} style={{ color: TEAL }} />
                          </div>
                          <div>
                            <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{l}</p>
                            <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text)' }}>{v}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {(property.virtualTour || property.floorPlan || property.brochure || (property.videos?.length || 0) > 0) && (
                      <div className="flex flex-wrap gap-2 mt-5">
                        {property.virtualTour && (
                          <a href={property.virtualTour} target="_blank" rel="noopener noreferrer" className="btn-ghost flex-1 min-w-[160px] py-3 gap-2">
                            <Video size={15} style={{ color: TEAL }} /> Virtual Tour
                          </a>
                        )}
                        {property.floorPlan && (
                          <a href={property.floorPlan} target="_blank" rel="noopener noreferrer" className="btn-ghost flex-1 min-w-[160px] py-3 gap-2">
                            <MapIcon size={15} style={{ color: TEAL }} /> Floor Plan
                          </a>
                        )}
                        {property.brochure && (
                          <a href={property.brochure} target="_blank" rel="noopener noreferrer" className="btn-ghost flex-1 min-w-[160px] py-3 gap-2">
                            <FileText size={15} style={{ color: TEAL }} /> Download Brochure
                          </a>
                        )}
                        {property.videos?.map((v, i) => (
                          <a key={v.url} href={v.url} target="_blank" rel="noopener noreferrer" className="btn-ghost flex-1 min-w-[160px] py-3 gap-2">
                            <Video size={15} style={{ color: TEAL }} /> {v.title || `Video ${property.videos!.length > 1 ? i + 1 : ''}`.trim()}
                          </a>
                        ))}
                      </div>
                    )}

                    {property.floorPlan && (
                      <div className="mt-5 rounded-xl overflow-hidden relative h-64" style={{ background: 'var(--bg-alt)' }}>
                        <Image src={property.floorPlan} alt="Floor plan" fill className="object-contain" sizes="(max-width:768px)100vw,700px" />
                      </div>
                    )}
                  </div>

                  {/* Additional / nearby details — free-text fields the
                      agent filled in, only rendered when actually set. */}
                  {NEARBY_FACT_FIELDS.some(({ key }) => property.amenities?.[key]) && (
                    <div className="card p-6">
                      <h3 className="font-semibold mb-5" style={{ color: 'var(--text)' }}>Additional Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                        {NEARBY_FACT_FIELDS.filter(({ key }) => property.amenities?.[key]).map(({ key, l }) => (
                          <div key={key}>
                            <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{l}</p>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{property.amenities[key]}</p>
                          </div>
                        ))}
                        {property.amenities?.distanceFromAirport && (
                          <div>
                            <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Distance From Airport</p>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{property.amenities.distanceFromAirport} km</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Location map — custom Google map */}
                  {coords && (
                    <div className="card p-6">
                      <h3 className="font-semibold mb-5 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                        <MapIcon size={16} style={{ color: TEAL }} /> Location
                      </h3>
                      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', height: 320 }}>
                        <LocationMap lat={coords.lat} lng={coords.lng} />
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs mt-2 inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                        style={{ color: TEAL }}
                      >
                        <LinkIcon size={11} /> View larger map
                      </a>
                    </div>
                  )}

                  {/* Regulatory information — Bayut-style, incl. DLD permit QR */}
                  <div className="card p-6">
                    <h3 className="font-semibold mb-5" style={{ color: 'var(--text)' }}>Regulatory information</h3>
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                        {[
                          { icon: Tag,         l: 'Ref ID',     v: property._id.slice(-6).toUpperCase() },
                          { icon: Clock,       l: 'Listed',     v: timeAgo(property.createdAt) },
                          { icon: MapPin,      l: 'Zone name',  v: property.location.area },
                          { icon: ShieldCheck, l: 'Permit No.', v: property.permitNumber },
                        ].filter(({ v }) => v).map(({ icon: Icon, l, v }) => (
                          <div key={l} className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.10)', border: '1px solid rgba(203,1,1,0.20)' }}>
                              <Icon size={14} style={{ color: TEAL }} />
                            </div>
                            <div>
                              <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{l}</p>
                              <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text)' }}>{v}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        {property.permitQrImage ? (
                          <img
                            src={property.permitQrImage}
                            alt="DLD Permit QR code" width={90} height={90} className="rounded-lg object-cover"
                            style={{ border: '1px solid var(--border)' }}
                          />
                        ) : property.permitNumber ? (
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(property.permitNumber)}`}
                            alt="DLD Permit QR code" width={90} height={90} className="rounded-lg"
                            style={{ border: '1px solid var(--border)' }}
                          />
                        ) : (
                          <div className="w-[90px] h-[90px] rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-alt)', border: '1px dashed var(--border)' }}>
                            <Landmark size={22} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                          </div>
                        )}
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>DLD Permit</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div ref={featuresRef} id="section-features" style={{ scrollMarginTop: SCROLL_OFFSET }} className="space-y-5">
                  {features.length > 0 ? (
                    <>
                      {AMENITY_GROUPS.map(group => {
                        const activeKeys = group.keys.filter(k => features.some(([fk]) => fk === k))
                        if (activeKeys.length === 0) return null
                        return (
                          <div key={group.title} className="card p-6">
                            <h3 className="font-semibold mb-5" style={{ color: 'var(--text)' }}>{group.title}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {activeKeys.map(key => {
                                const meta = AMENITY_META[key]
                                const Icon = meta?.icon || CheckCircle2
                                return (
                                  <div key={key} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-alt)' }}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.10)', border: '1px solid rgba(203,1,1,0.20)' }}>
                                      <Icon size={14} style={{ color: TEAL }} />
                                    </div>
                                    <span className="text-sm" style={{ color: 'var(--text-mid)' }}>
                                      {meta?.label || key.replace(/([A-Z])/g,' $1').trim()}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}

                      {/* Any active feature key that doesn't belong to one of the
                          categorized groups above (legacy/unclassified data) still
                          gets shown, just under a catch-all heading. */}
                      {(() => {
                        const grouped = new Set(AMENITY_GROUPS.flatMap(g => g.keys))
                        const other = features.filter(([key]) => !grouped.has(key))
                        if (other.length === 0) return null
                        return (
                          <div className="card p-6">
                            <h3 className="font-semibold mb-5" style={{ color: 'var(--text)' }}>Other</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {other.map(([key]) => {
                                const meta = AMENITY_META[key]
                                const Icon = meta?.icon || CheckCircle2
                                return (
                                  <div key={key} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-alt)' }}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.10)', border: '1px solid rgba(203,1,1,0.20)' }}>
                                      <Icon size={14} style={{ color: TEAL }} />
                                    </div>
                                    <span className="text-sm" style={{ color: 'var(--text-mid)' }}>
                                      {meta?.label || key.replace(/([A-Z])/g,' $1').trim()}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })()}
                    </>
                  ) : (
                    <div className="card p-6">
                      <h3 className="font-semibold mb-5" style={{ color: 'var(--text)' }}>Amenities & Features</h3>
                      <p className="muted">No features listed for this property.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* ── Right: CTA Card ──────────── */}
          <div className="space-y-4">
            {/* Lead CTA */}
            <div className="card p-6 top-20" style={{ borderColor: 'rgba(203,1,1,0.25)', background: 'linear-gradient(180deg, rgba(203,1,1,0.06), var(--surface) 45%)' }}>
              <div className="text-center mb-6">
                <p className="text-3xl font-bold grad-text">{formatPrice(property.price)}</p>
                {property.listingType === 'rent' && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{rentPeriodLabel(property)}</p>}
                {property.listingType === 'rent' && <div className="mt-2"><RentalBadge property={property} /></div>}
              </div>

              <button onClick={() => setLeadOpen(true)} className="btn-primary w-full py-4 text-base mb-3">
                <Send size={16} />
                Express Interest
              </button>

              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-outline w-full py-3.5 mb-3 gap-2">
                <MessageCircle size={16} style={{ color: 'var(--green)' }} />
                WhatsApp Us
              </a>

              <a href={telHref} className="btn-outline w-full py-3.5 gap-2">
                <Phone size={16} style={{ color: TEAL }} />
                Call {COMPANY_PHONE_DISPLAY}
              </a>

              <div className="divider my-5" />

              {/* Trust badges */}
              <div className="space-y-3">
                {[
                  { icon: Shield,  text: 'RERA Verified Listing'     },
                  { icon: Award,   text: 'DLD Licensed Agency'        },
                  { icon: Clock,   text: 'Response within 2 hours'    },
                  { icon: Star,    text: '4.9/5 Client Rating'        },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Icon size={13} style={{ color: TEAL }} className="flex-shrink-0" />
                    {text}
                  </div>
                ))}
              </div>

              <div className="divider my-5" />

              {/* The agent mediates every enquiry — buyers never see the
                  seller's contact details directly (centralized model). */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white" style={{ background: 'var(--grad)' }}>
                  {agent?.name?.[0] || 'A'}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{agent?.name || 'Our Agent Team'}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your dedicated agent for this listing</p>
                </div>
              </div>
            </div>

            {/* Useful Links */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Useful Links</h3>
              <div className="space-y-1">
                {USEFUL_LINKS.map(l => (
                  <Link key={l.href} href={l.href}
                    className="flex items-center justify-between py-2 text-xs group transition-colors"
                    style={{ color: 'var(--text-mid)' }}>
                    <span className="group-hover:opacity-75 transition-opacity">{l.label}</span>
                    <Link2 size={12} style={{ color: 'var(--text-muted)' }} />
                  </Link>
                ))}
              </div>
            </div>

            {/* Other nearby areas */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Compass size={14} style={{ color: TEAL }} /> Other Nearby Areas
              </h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Apartments in other popular areas</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_AREAS.filter(a => a !== property.location.area).slice(0, 6).map(area => (
                  <Link key={area} href={`/buyer/properties?area=${encodeURIComponent(area)}&type=apartment`}
                    className="badge badge-gray text-xs hover:opacity-75 transition-opacity">
                    {area}
                  </Link>
                ))}
              </div>
            </div>

            {/* Invest in Off-Plan */}
            <Link href="/buyer/properties?completion=off_plan"
              className="card p-5 block transition-transform hover:-translate-y-0.5"
              style={{ background: 'var(--grad)', border: 'none' }}>
              <TrendUpIcon size={20} className="text-white mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">Invest in Off-Plan</h3>
              <p className="text-xs text-white/85 leading-relaxed">
                Explore off-plan projects with flexible payment plans and strong ROI potential.
              </p>
            </Link>

            {/* Report listing */}
            <button onClick={() => setReportOpen(true)}
              className="btn-ghost w-full py-3 gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <ReportIcon size={13} />
              Report this property
            </button>

             {/* Mortgage helpline */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.10)', border: '1px solid rgba(203,1,1,0.20)' }}>
                  <Landmark size={15} style={{ color: TEAL }} />
                </div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Mortgage Helpline</h3>
              </div>
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>Thinking about financing this?</p>
              <div className="space-y-2 mb-4">
                {[
                  'The right bank and rate, matched for you',
                  'A dedicated expert guides you to approval',
                  'Completely free — no fees, no obligation',
                ].map(line => (
                  <div key={line} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={13} style={{ color: TEAL }} className="flex-shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
              <button onClick={talkToMortgageExpert} className="btn-outline w-full py-3 text-sm">
                Calculate My Mortgage
              </button>
            </div>

            <RecentlyViewedCard excludeSlug={property.slug} />

            {/* Ad slot — standard 300x600 half-page unit. Sticks once it
                reaches the navbar, and un-sticks naturally once the sidebar
                column (which stretches to match the taller main column under
                CSS Grid's default row-stretch) has fully scrolled past. */}
            <div className="sticky rounded-2xl flex flex-col items-center justify-center gap-2 mx-auto"
              style={{ top: 84, width: '100%', maxWidth: 300, height: 600, border: '1px dashed var(--border)', background: 'var(--bg-alt)' }}>
              <Sparkles size={20} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Advertisement</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>300 × 600</p>
            </div>

          </div>
        </div>

        {/* ── Recommended Project ──────── */}
        {recommended.length > 0 && (
          <div className="mt-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="heading-md mb-2">Recommended <span className="grad-text">Project</span></h2>
                <p className="muted">Other units in {property.projectName}{property.developer ? ` by ${property.developer}` : ''}</p>
              </div>
              <Link href={`/buyer/properties?q=${encodeURIComponent(property.projectName || '')}`} className="btn-ghost btn-sm hidden md:flex">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommended.slice(0,3).map((p, i) => (
                <motion.div key={p._id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}>
                  <PropertyCard property={p} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Similar Properties ──────── */}
        {similar.length > 0 && (
          <div className="mt-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="heading-md mb-2">Similar <span className="grad-text">Properties</span></h2>
                <p className="muted">More properties in {property.location.area}</p>
              </div>
              <Link href={`/buyer/properties?area=${property.location.area}`} className="btn-ghost btn-sm hidden md:flex">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {similar.slice(0,3).map((p, i) => (
                <motion.div key={p._id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}>
                  <PropertyCard property={p} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recommended For You ──────── */}
        {forYou.length > 0 && (
          <div className="mt-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="heading-md mb-2">Recommended <span className="grad-text">For You</span></h2>
                <p className="muted">Popular listings across the marketplace</p>
              </div>
              <Link href="/buyer/properties" className="btn-ghost btn-sm hidden md:flex">
                View All
              </Link>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
              {forYou.map((p, i) => (
                <motion.div key={p._id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                  className="flex-shrink-0" style={{ width: 300, scrollSnapAlign: 'start' }}>
                  <PropertyCard property={p} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky bottom contact bar ──────────────────── */}
      {/* Always there, so a buyer can call, WhatsApp, share or enquire from anywhere on the page. */}
      <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut', delay: 0.3 }}
            className="fixed bottom-0 inset-x-0 z-40"
            style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.10)', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
          >
            <div className="wrap flex items-center gap-3 py-3">
              <div className="hidden sm:block flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{property.title}</p>
                <p className="text-sm font-bold grad-text">{formatPrice(property.price)}{rentSuffix(property)}</p>
              </div>
              <a href={telHref} className="btn-outline p-3 flex-shrink-0" aria-label={`Call ${COMPANY_PHONE_DISPLAY}`} title={`Call ${COMPANY_PHONE_DISPLAY}`}>
                <Phone size={17} style={{ color: TEAL }} />
              </a>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-outline p-3 flex-shrink-0" aria-label="WhatsApp us" title="WhatsApp us">
                <MessageCircle size={17} style={{ color: 'var(--green)' }} />
              </a>
              <button onClick={share} className="btn-outline p-3 flex-shrink-0" aria-label="Share this property" title="Share">
                <Share2 size={17} style={{ color: TEAL }} />
              </button>
              <button onClick={() => setLeadOpen(true)} className="btn-primary flex-1 sm:flex-initial py-3 px-6">
                <Send size={15} />
                Express Interest
              </button>
            </div>
      </motion.div>

      {/* ── Lightbox ──────────────── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}>
            <button className="absolute top-4 right-4 w-10 h-10 glass rounded-xl flex items-center justify-center text-white"
              onClick={() => setLightbox(false)}>
              <X size={18} />
            </button>
            <div className="relative w-full max-w-4xl aspect-video" onClick={e => e.stopPropagation()}>
              {images[imgIdx]?.url && (
                <Image src={images[imgIdx].url} alt="" fill className="object-contain" />
              )}
              {images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => (i-1+images.length)%images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-xl flex items-center justify-center text-white">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setImgIdx(i => (i+1)%images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-xl flex items-center justify-center text-white">
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lead Modal ────────────── */}
      <AnimatePresence>
        {leadOpen && (
          <LeadModal property={property} onClose={() => setLeadOpen(false)} />
        )}
      </AnimatePresence>

      {/* ── Report Modal ──────────── */}
      <AnimatePresence>
        {reportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(6px)' }}
            onClick={() => setReportOpen(false)}>
            <motion.div initial={{ opacity:0, scale:0.94, y:12 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.94 }}
              className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Report this Property</h2>
                <button onClick={() => setReportOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--bg-alt)', color: 'var(--text-muted)' }}>
                  <X size={15} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Reason *</label>
                  <select className="select-field" value={reportReason} onChange={e => setReportReason(e.target.value)}>
                    <option value="">Select a reason…</option>
                    {REPORT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Additional details (optional)</label>
                  <textarea className="input resize-none" rows={3} value={reportDetails} onChange={e => setReportDetails(e.target.value)}
                    placeholder="Tell us more about the issue…" />
                </div>
                <button onClick={submitReport} disabled={reportSubmitting} className="btn-primary w-full py-3.5 text-sm disabled:opacity-60">
                  {reportSubmitting ? <Loader2 size={15} className="animate-spin" /> : <ReportIcon size={15} />}
                  {reportSubmitting ? 'Submitting…' : 'Submit Report'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
      {/* Room for the fixed contact bar, so it never covers the end of the footer. */}
      <div aria-hidden className="h-24" />
    </div>
  )
}
