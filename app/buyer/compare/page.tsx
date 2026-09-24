'use client'
import Link from 'next/link'
import Image from 'next/image'
import { X, Plus, MapPin, CheckCircle2, Minus, ArrowRight, GitCompare, Building2 } from 'lucide-react'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import { useCompareStore } from '@/store/compareStore'
import { formatPrice, formatArea, rentSuffix } from '@/lib/utils'
import { rentalLabel } from '@/lib/rental'

const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

const SPECS: { label: string; value: (p: any) => React.ReactNode }[] = [
  { label: 'Price',        value: p => `${formatPrice(p.price)}${rentSuffix(p)}` },
  { label: 'Type',         value: p => cap(p.type) },
  { label: 'Listing',      value: p => (p.listingType === 'rent' ? 'For Rent' : 'For Sale') },
  { label: 'Bedrooms',     value: p => (p.amenities?.bedrooms ? `${p.amenities.bedrooms} Bed` : 'Studio') },
  { label: 'Bathrooms',    value: p => (p.amenities?.bathrooms ? `${p.amenities.bathrooms} Bath` : undefined) },
  { label: 'Floor Area',   value: p => (p.amenities?.floorArea ? `${formatArea(p.amenities.floorArea)} sqft` : undefined) },
  { label: 'Price / sqft', value: p => (p.pricePerSqft ? `AED ${Math.round(p.pricePerSqft).toLocaleString()}` : undefined) },
  { label: 'Parking',      value: p => p.amenities?.parkingSpaces },
  { label: 'Furnishing',   value: p => cap(p.furnishing?.replace('_', ' ')) },
  { label: 'Completion',   value: p => (p.listingType === 'rent' ? undefined : p.completion === 'off_plan' ? 'Off-Plan' : 'Ready') },
  { label: 'Availability', value: p => (p.listingType === 'rent' ? rentalLabel(p) : undefined) },
  { label: 'Area',         value: p => p.location?.area },
  { label: 'Emirate',      value: p => p.location?.emirate },
]

const FEATURES = ['pool', 'gym', 'concierge', 'security24h', 'childrenPlay', 'bbqArea', 'sauna', 'smartHome', 'centralAC', 'coveredParking', 'maidRoom', 'petsAllowed']
const featureLabel = (f: string) => cap(f.replace(/([A-Z])/g, ' $1').replace(/(\d+)h/, ' $1h').trim().toLowerCase())

const muted = { color: 'var(--text-muted)' }
const cellBorder = { borderLeft: '1px solid var(--border-soft)' }

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useCompareStore()

  const cols: any[] = [...compareList]
  while (cols.length < 2) cols.push(null)
  const grid = { gridTemplateColumns: `minmax(110px, 180px) repeat(${cols.length}, minmax(180px, 1fr))` }

  return (
    <div className="page">
      <Navbar />
      <div className="wrap py-10 pb-20 min-h-[70vh]">
        <div className="flex items-end justify-between gap-3 flex-wrap mb-7">
          <div>
            <h1 className="heading-md mb-1">Compare <span className="grad-text">Properties</span></h1>
            <p className="muted text-sm">Side-by-side comparison of your selected properties</p>
          </div>
          {compareList.length > 0 && (
            <button onClick={clearCompare} className="btn-ghost btn-sm gap-1.5" style={{ color: '#E11D48' }}>
              <X size={13} /> Clear all
            </button>
          )}
        </div>

        {compareList.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(203,1,1,0.08)', border: '1px solid rgba(203,1,1,0.18)' }}>
              <GitCompare size={26} style={{ color: 'var(--teal)' }} />
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Nothing to compare yet</h2>
            <p className="muted text-sm mb-6 max-w-sm mx-auto">Add up to 2 properties using the compare button on any listing to see them side by side.</p>
            <Link href="/for-sale" className="btn-primary">Browse Properties <ArrowRight size={14} /></Link>
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <div className="min-w-fit">
              {/* Property headers */}
              <div className="grid" style={{ ...grid, borderBottom: '1px solid var(--border)' }}>
                <div className="p-4 flex items-end">
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={muted}>Comparing</p>
                </div>
                {cols.map((p, i) => (
                  <div key={p?._id || `empty-${i}`} className="p-4" style={cellBorder}>
                    {p ? (
                      <div className="relative">
                        <button onClick={() => removeFromCompare(p._id)} aria-label="Remove"
                          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                          <X size={13} style={{ color: '#334155' }} />
                        </button>
                        <Link href={`/buyer/properties/${p.slug || p._id}`} className="block">
                          <div className="relative h-36 rounded-xl overflow-hidden mb-3" style={{ background: 'var(--bg-alt)' }}>
                            {p.images?.[0]?.url
                              ? <Image src={p.images[0].url} alt={p.title} fill sizes="320px" className="object-cover" />
                              : <Building2 size={28} className="absolute inset-0 m-auto" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />}
                          </div>
                          <h3 className="font-semibold text-[0.95rem] leading-snug line-clamp-2 mb-1 hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>{p.title}</h3>
                        </Link>
                        <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-mid)' }}>
                          <MapPin size={11} style={{ color: 'var(--teal)' }} />{p.location?.area}
                        </p>
                        <p className="text-lg font-bold grad-text mt-1.5">{formatPrice(p.price)}{rentSuffix(p)}</p>
                      </div>
                    ) : (
                      <Link href="/for-sale" className="h-full min-h-[220px] flex flex-col items-center justify-center rounded-xl text-center transition-colors hover:bg-[var(--bg-alt)]"
                        style={{ border: '2px dashed var(--border)' }}>
                        <Plus size={20} style={{ color: 'var(--teal)' }} />
                        <p className="text-xs mt-2" style={muted}>Add a property</p>
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {/* Specs */}
              {SPECS.map((spec, si) => (
                <div key={spec.label} className="grid" style={{ ...grid, background: si % 2 ? 'var(--bg-alt)' : undefined }}>
                  <div className="px-4 py-3 text-xs font-medium" style={muted}>{spec.label}</div>
                  {cols.map((p, i) => (
                    <div key={i} className="px-4 py-3 text-sm font-semibold" style={{ ...cellBorder, color: 'var(--text)' }}>
                      {p ? (spec.value(p) ?? <span style={{ ...muted, fontWeight: 400 }}>—</span>) : ''}
                    </div>
                  ))}
                </div>
              ))}

              {/* Features */}
              <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ ...muted, borderTop: '1px solid var(--border)' }}>Features</div>
              {FEATURES.map((feat, fi) => (
                <div key={feat} className="grid" style={{ ...grid, background: fi % 2 ? undefined : 'var(--bg-alt)' }}>
                  <div className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-mid)' }}>{featureLabel(feat)}</div>
                  {cols.map((p, i) => (
                    <div key={i} className="px-4 py-2.5" style={cellBorder}>
                      {p && (p.features?.[feat]
                        ? <CheckCircle2 size={16} style={{ color: '#16A34A' }} />
                        : <Minus size={16} style={{ ...muted, opacity: 0.5 }} />)}
                    </div>
                  ))}
                </div>
              ))}

              {/* CTA */}
              <div className="grid" style={{ ...grid, borderTop: '1px solid var(--border)' }}>
                <div />
                {cols.map((p, i) => (
                  <div key={i} className="p-4" style={cellBorder}>
                    {p && (
                      <Link href={`/buyer/properties/${p.slug || p._id}`} className="btn-primary btn-sm w-full justify-center">
                        View Property <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
