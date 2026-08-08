'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ArrowLeft, MapPin, CalendarClock, Wallet, BedDouble, ShieldCheck, Phone, Building2, MessageCircleHeart,
} from 'lucide-react'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import ProjectInterestModal from '@/components/buyer/ProjectInterestModal'
import { projectAPI } from '@/lib/api'
import { formatPrice, cn } from '@/lib/utils'
import type { Project } from '@/types'

const STATUS_BADGE: Record<string, string> = {
  upcoming: 'badge-blue', under_construction: 'badge-teal', ready: 'badge-green', sold_out: 'badge-gray',
}

function Fact({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(49,178,222,0.08)' }}>
        <Icon size={16} style={{ color: 'var(--teal)' }} />
      </div>
      <div>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{value}</p>
      </div>
    </div>
  )
}

export default function ProjectDetailClient({ project }: { project: Project }) {
  const [related, setRelated] = useState<Project[]>([])
  const [interestOpen, setInterestOpen] = useState(false)
  const [activeImage, setActiveImage] = useState(project.coverImage || project.images[0]?.url || '')
  const gallery = [project.coverImage, ...project.images.map(i => i.url)].filter((v, i, arr): v is string => !!v && arr.indexOf(v) === i)

  useEffect(() => {
    projectAPI.getAll({ area: project.area, limit: 4 })
      .then(r => { if (r.data.success) setRelated((r.data.data.data || []).filter((p: Project) => p._id !== project._id).slice(0, 3)) })
      .catch(() => {})
  }, [project.area, project._id])

  const handover = [project.handoverQuarter, project.handoverYear].filter(Boolean).join(' ') || 'TBA'

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
            <h1 className="heading-lg mb-3 leading-tight">{project.title}</h1>
            <p className="text-sm flex items-center gap-1.5 mb-8" style={{ color: 'var(--text-muted)' }}>
              <MapPin size={13} style={{ color: 'var(--teal)' }} />{project.area}, {project.city}
            </p>

            {project.description && (
              <div className="rich-content text-base leading-relaxed" style={{ color: 'var(--text-mid)' }}
                dangerouslySetInnerHTML={{ __html: project.description }} />
            )}
          </article>

          <aside>
            <div className="sticky space-y-4" style={{ top: 96 }}>
              <div className="card p-5 space-y-4">
                <div>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Launch Price</p>
                  <p className="text-2xl font-bold grad-text">{formatPrice(project.priceFrom)}</p>
                  {project.priceTo && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>up to {formatPrice(project.priceTo)}</p>}
                </div>
                <div className="space-y-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  {project.bedrooms && <Fact icon={BedDouble} label="Bedrooms" value={project.bedrooms} />}
                  <Fact icon={CalendarClock} label="Handover" value={handover} />
                  {project.paymentPlan && <Fact icon={Wallet} label="Payment Plan" value={project.paymentPlan} />}
                  {project.permitNumber && (
                    <div className="flex items-center justify-between gap-3">
                      <Fact icon={ShieldCheck} label="DLD Permit" value={project.permitNumber} />
                      <img
                        src={project.permitQrImage || `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(project.permitNumber)}`}
                        alt="DLD Permit QR code" width={44} height={44} className="rounded-lg object-cover flex-shrink-0"
                        style={{ border: '1px solid var(--border)' }}
                      />
                    </div>
                  )}
                </div>
                <div className="pt-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => setInterestOpen(true)} className="btn-primary w-full justify-center gap-2">
                    <MessageCircleHeart size={14} /> I'm Interested
                  </button>
                  <a href="tel:+97144000000" className="btn-outline w-full justify-center gap-2"><Phone size={14} /> Call Our Team</a>
                </div>
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
