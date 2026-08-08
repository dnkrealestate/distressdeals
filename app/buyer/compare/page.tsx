'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { X, Plus, Bed, Bath, Maximize2, Car, MapPin, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import { useCompareStore } from '@/store/compareStore'
import { formatPrice, formatArea, cn, rentSuffix } from '@/lib/utils'

const SPECS = [
  { label: 'Price',        key: (p: any) => `${formatPrice(p.price)}${rentSuffix(p)}`                 },
  { label: 'Type',         key: (p: any) => p.type                                                   },
  { label: 'Listing',      key: (p: any) => p.listingType                                            },
  { label: 'Bedrooms',     key: (p: any) => p.amenities?.bedrooms || 'Studio'                        },
  { label: 'Bathrooms',    key: (p: any) => p.amenities?.bathrooms                                   },
  { label: 'Floor Area',   key: (p: any) => `${formatArea(p.amenities?.floorArea)} sqft`             },
  { label: 'Price/sqft',   key: (p: any) => p.pricePerSqft ? `AED ${Math.round(p.pricePerSqft).toLocaleString()}` : '—' },
  { label: 'Parking',      key: (p: any) => p.amenities?.parkingSpaces                               },
  { label: 'Furnishing',   key: (p: any) => p.furnishing?.replace('_',' ')                           },
  { label: 'Completion',   key: (p: any) => p.completion?.replace('_',' ')                           },
  { label: 'Area',         key: (p: any) => p.location?.area                                         },
  { label: 'Emirate',      key: (p: any) => p.location?.emirate                                      },
]

const FEATURES = ['pool','gym','concierge','security24h','childrenPlay','bbqArea','sauna','smartHome','centralAC','coveredParking','maidRoom','petsAllowed']

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useCompareStore()

  if (compareList.length === 0) return (
    <div className="page">
      <Navbar />
      <div className="wrap py-24 text-center min-h-screen">
        <div className="w-20 h-20 rounded-3xl glass-gold flex items-center justify-center mx-auto mb-6">
          <Plus size={32} className="text-gold-400 rotate-45" />
        </div>
        <h2 className="heading-md text-white mb-3">Nothing to Compare</h2>
        <p className="muted mb-8 max-w-sm mx-auto">Add up to 2 properties using the compare button on any listing to see them side by side.</p>
        <Link href="/buyer/properties" className="btn-gold">Browse Properties <ArrowRight size={15} /></Link>
      </div>
      <Footer />
    </div>
  )

  const cols = [...compareList]
  while (cols.length < 2) cols.push(null as any)

  return (
    <div className="page">
      <Navbar />
      <div className="wrap py-10 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="heading-md mb-1">Compare <span className="gold-text">Properties</span></h1>
            <p className="muted">Side-by-side comparison of your selected properties</p>
          </div>
          {compareList.length > 0 && (
            <button onClick={clearCompare} className="btn-ghost btn-sm gap-2 text-red-400 border-red-500/20 hover:bg-red-500/8">
              <X size={14} /> Clear All
            </button>
          )}
        </div>

        <div className="glass rounded-3xl overflow-hidden">
          {/* Property headers */}
          <div className="grid grid-cols-3 border-b border-white/5">
            <div className="p-5 border-r border-white/5">
              <p className="text-xs text-white/30 uppercase tracking-widest">Comparing</p>
            </div>
            {cols.map((p, i) => (
              <div key={i} className={cn('p-4', i === 0 && 'border-r border-white/5')}>
                {p ? (
                  <div className="relative">
                    <button onClick={() => removeFromCompare(p._id)}
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full glass flex items-center justify-center text-white/40 hover:text-red-400 transition-colors z-10">
                      <X size={11} />
                    </button>
                    <div className="relative h-36 rounded-xl overflow-hidden mb-3 bg-onyx-800">
                      {p.images?.[0]?.url ? (
                        <Image src={p.images[0].url} alt={p.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10 text-3xl">🏙️</div>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm text-white line-clamp-2 mb-1">{p.title}</h3>
                    <p className="text-xs text-white/40 flex items-center gap-1">
                      <MapPin size={10} className="text-gold-400" />{p.location.area}
                    </p>
                    <p className="text-lg font-bold text-gold-300 mt-2">{formatPrice(p.price)}{rentSuffix(p)}</p>
                  </div>
                ) : (
                  <Link href="/buyer/properties"
                    className="h-full flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-white/10 rounded-xl hover:border-gold-500/30 transition-colors group">
                    <div className="w-10 h-10 rounded-xl glass-gold flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Plus size={18} className="text-gold-400" />
                    </div>
                    <p className="text-xs text-white/35 group-hover:text-white/60 transition-colors">Add Property</p>
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Specs rows */}
          <div>
            {SPECS.map((spec, si) => (
              <div key={spec.label} className={cn('grid grid-cols-3', si % 2 === 0 ? '' : 'bg-white/[0.015]')}>
                <div className="px-5 py-3 border-r border-white/5 flex items-center">
                  <p className="text-xs text-white/35 font-medium">{spec.label}</p>
                </div>
                {cols.map((p, i) => (
                  <div key={i} className={cn('px-5 py-3 flex items-center', i === 0 && 'border-r border-white/5')}>
                    <p className="text-sm text-white/75 capitalize">{p ? spec.key(p) : '—'}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Features comparison */}
          <div className="border-t border-white/5">
            <div className="grid grid-cols-3 bg-white/[0.02]">
              <div className="px-5 py-4 border-r border-white/5">
                <p className="text-xs text-white/30 uppercase tracking-widest font-medium">Features</p>
              </div>
              {cols.map((_, i) => <div key={i} className={cn('py-4', i === 0 && 'border-r border-white/5')} />)}
            </div>
            {FEATURES.map((feat, fi) => (
              <div key={feat} className={cn('grid grid-cols-3', fi % 2 === 0 ? '' : 'bg-white/[0.015]')}>
                <div className="px-5 py-3 border-r border-white/5">
                  <p className="text-xs text-white/35 capitalize">{feat.replace(/([A-Z])/g,' $1').trim()}</p>
                </div>
                {cols.map((p, i) => (
                  <div key={i} className={cn('px-5 py-3 flex items-center', i === 0 && 'border-r border-white/5')}>
                    {p ? (
                      p.features?.[feat]
                        ? <CheckCircle2 size={16} className="text-emerald-400" />
                        : <XCircle size={16} className="text-white/15" />
                    ) : <span className="text-white/15">—</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* CTA row */}
          <div className="grid grid-cols-3 border-t border-white/5 bg-white/[0.02]">
            <div className="px-5 py-5 border-r border-white/5" />
            {cols.map((p, i) => (
              <div key={i} className={cn('px-4 py-5', i === 0 && 'border-r border-white/5')}>
                {p && (
                  <Link href={`/buyer/properties/${p.slug || p._id}`} className="btn-gold w-full text-xs py-2.5">
                    View Property <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}