'use client'
import Link from 'next/link'
import Image from 'next/image'
import { X, Plus, MapPin, CheckCircle2, Minus, ArrowRight, GitCompare, Building2 } from 'lucide-react'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import { useProjectCompareStore, MAX_PROJECT_COMPARE } from '@/store/projectCompareStore'
import { AMENITY_META } from '@/lib/amenities'
import { formatPrice } from '@/lib/utils'
import { withSqft, withUnit } from '@/components/buyer/ProjectCard'
import type { Project } from '@/types'

const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

const ROWS: { label: string; value: (p: Project) => string | undefined }[] = [
  { label: 'Starting Price', value: p => formatPrice(p.priceFrom) },
  { label: 'Price Up To',    value: p => (p.priceTo ? formatPrice(p.priceTo) : undefined) },
  { label: 'Developer',      value: p => p.developer },
  { label: 'Status',         value: p => cap(p.status?.replace('_', ' ')) },
  { label: 'Handover',       value: p => [p.handoverQuarter, p.handoverYear].filter(Boolean).join(' ') || undefined },
  { label: 'Payment Plan',   value: p => p.paymentPlan },
  { label: 'Property Type',  value: p => cap(p.type) },
  { label: 'Bedrooms',       value: p => withUnit(p.bedrooms, 'Bed') || undefined },
  { label: 'Bathrooms',      value: p => withUnit(p.bathrooms, 'Bath') || undefined },
  { label: 'Size Range',     value: p => withSqft(p.sizeRange) || undefined },
  { label: 'Area',           value: p => [p.area, p.community].filter(Boolean).join(', ') },
  { label: 'Emirate',        value: p => p.emirate },
]

export default function ProjectComparePage() {
  const { projects, remove, clear } = useProjectCompareStore()

  // Amenities any of the picked projects has — rows nobody has aren't worth showing.
  const amenityKeys = Array.from(new Set(projects.flatMap(p => Object.entries(p.amenities || {}).filter(([, v]) => v).map(([k]) => k))))
    .filter(k => AMENITY_META[k])
  const slots: (Project | null)[] = [...projects]
  while (slots.length < Math.max(2, Math.min(projects.length + 1, MAX_PROJECT_COMPARE))) slots.push(null)
  const gridCols = { gridTemplateColumns: `minmax(120px, 180px) repeat(${slots.length}, minmax(200px, 1fr))` }

  return (
    <div className="page">
      <Navbar />
      <div className="wrap py-10 pb-20 min-h-[70vh]">
        <div className="flex items-end justify-between gap-3 flex-wrap mb-7">
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              <Link href="/projects" className="hover:underline">New Projects</Link> › Compare
            </p>
            <h1 className="heading-md">Compare <span className="grad-text">Projects</span></h1>
            <p className="muted text-sm mt-1">Prices, payment plans and handover dates side by side — up to {MAX_PROJECT_COMPARE} projects.</p>
          </div>
          {projects.length > 0 && (
            <button onClick={clear} className="btn-ghost btn-sm gap-1.5" style={{ color: '#E11D48' }}>
              <X size={13} /> Clear all
            </button>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(203,1,1,0.08)', border: '1px solid rgba(203,1,1,0.18)' }}>
              <GitCompare size={26} style={{ color: 'var(--teal)' }} />
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Nothing to compare yet</h2>
            <p className="muted text-sm mb-6 max-w-sm mx-auto">Tap the compare icon on any project card to add it here.</p>
            <Link href="/projects" className="btn-primary">Browse New Projects <ArrowRight size={14} /></Link>
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <div className="min-w-fit">
              {/* Headers */}
              <div className="grid" style={{ ...gridCols, borderBottom: '1px solid var(--border)' }}>
                <div className="p-4 flex items-end">
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{projects.length} selected</p>
                </div>
                {slots.map((p, i) => (
                  <div key={p?._id || `empty-${i}`} className="p-4" style={{ borderLeft: '1px solid var(--border-soft)' }}>
                    {p ? <Header project={p} onRemove={() => remove(p._id)} /> : (
                      <Link href="/projects" className="h-full min-h-[210px] flex flex-col items-center justify-center rounded-xl text-center transition-colors hover:bg-[var(--bg-alt)]"
                        style={{ border: '2px dashed var(--border)' }}>
                        <Plus size={20} style={{ color: 'var(--teal)' }} />
                        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Add a project</p>
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {ROWS.map((row, ri) => (
                <div key={row.label} className="grid" style={{ ...gridCols, background: ri % 2 ? 'var(--bg-alt)' : undefined }}>
                  <div className="px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{row.label}</div>
                  {slots.map((p, i) => (
                    <div key={i} className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text)', borderLeft: '1px solid var(--border-soft)' }}>
                      {p ? (row.value(p) || <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>—</span>) : ''}
                    </div>
                  ))}
                </div>
              ))}

              {amenityKeys.length > 0 && (
                <>
                  <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>Amenities</div>
                  {amenityKeys.map((k, ri) => (
                    <div key={k} className="grid" style={{ ...gridCols, background: ri % 2 ? undefined : 'var(--bg-alt)' }}>
                      <div className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-mid)' }}>{AMENITY_META[k].label}</div>
                      {slots.map((p, i) => (
                        <div key={i} className="px-4 py-2.5" style={{ borderLeft: '1px solid var(--border-soft)' }}>
                          {p && (p.amenities?.[k]
                            ? <CheckCircle2 size={16} style={{ color: '#16A34A' }} />
                            : <Minus size={16} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />)}
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}

              <div className="grid" style={{ ...gridCols, borderTop: '1px solid var(--border)' }}>
                <div />
                {slots.map((p, i) => (
                  <div key={i} className="p-4" style={{ borderLeft: '1px solid var(--border-soft)' }}>
                    {p && <Link href={`/projects/${p.slug}`} className="btn-primary btn-sm w-full justify-center">View Project <ArrowRight size={13} /></Link>}
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

function Header({ project: p, onRemove }: { project: Project; onRemove: () => void }) {
  const img = p.coverImage || p.images?.[0]?.url
  return (
    <div className="relative">
      <button onClick={onRemove} aria-label="Remove" className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <X size={13} style={{ color: '#334155' }} />
      </button>
      <Link href={`/projects/${p.slug}`} className="block">
        <div className="relative h-32 rounded-xl overflow-hidden mb-3" style={{ background: 'var(--bg-alt)' }}>
          {img ? <Image src={img} alt={p.title} fill sizes="300px" className="object-cover" />
               : <Building2 size={28} className="absolute inset-0 m-auto" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />}
        </div>
        <h3 className="font-semibold text-[0.95rem] leading-snug line-clamp-2 hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>{p.title}</h3>
      </Link>
      {p.developer && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>by <span className="font-semibold" style={{ color: 'var(--teal)' }}>{p.developer}</span></p>}
      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-mid)' }}><MapPin size={11} style={{ color: 'var(--teal)' }} />{p.area}</p>
      <p className="text-lg font-bold grad-text mt-1.5">{formatPrice(p.priceFrom)}</p>
    </div>
  )
}
