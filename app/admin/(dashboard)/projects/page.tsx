'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import {
  Plus, X, Trash2, Pencil, Building2, UploadCloud, Loader2, Star, Eye, QrCode,
} from 'lucide-react'
import { projectAPI, uploadAPI, developerAPI } from '@/lib/api'
import { formatDate, cn, formatPrice } from '@/lib/utils'
import { UAE_EMIRATES, DUBAI_COMMUNITIES } from '@/lib/constants'
import BlockEditor, { Block, htmlToBlocks, blocksToHtml } from '@/components/shared/BlockEditor'
import type { Project, Developer } from '@/types'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: 'upcoming',            label: 'Upcoming' },
  { value: 'under_construction',  label: 'Under Construction' },
  { value: 'ready',               label: 'Ready' },
  { value: 'sold_out',            label: 'Sold Out' },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>{label}</label>
      {children}
    </div>
  )
}

// ══════════════════════════ Form ══════════════════════════

function ProjectForm({ project, onClose, onSaved }: { project: Project | null; onClose: () => void; onSaved: () => void }) {
  const [coverImage, setCoverImage] = useState(project?.coverImage || '')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [gallery, setGallery] = useState<string[]>(project?.images?.map(i => i.url) || [])
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [blocks, setBlocks] = useState<Block[]>(() => htmlToBlocks(project?.description || ''))
  const [submitting, setSubmitting] = useState(false)
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [permitQrImage, setPermitQrImage] = useState(project?.permitQrImage || '')
  const [uploadingQr, setUploadingQr] = useState(false)

  useEffect(() => {
    developerAPI.getAll().then(r => { if (r.data.success) setDevelopers(r.data.data || []) }).catch(() => {})
  }, [])

  const onDropQr = useCallback(async (accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    setUploadingQr(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const res = await uploadAPI.image(fd)
      if (res.data.success) setPermitQrImage(res.data.data.url)
      else toast.error('Upload failed')
    } catch (err: any) {
      toast.error(err?.error || 'Failed to upload QR image')
    } finally {
      setUploadingQr(false)
    }
  }, [])
  const qrDropzone = useDropzone({
    onDrop: onDropQr,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 5 * 1024 * 1024, multiple: false,
  })

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      title:           project?.title || '',
      developer:       project?.developer || '',
      area:            project?.area || '',
      community:       project?.community || '',
      city:            project?.city || 'Dubai',
      emirate:         project?.emirate || 'Dubai',
      priceFrom:       project?.priceFrom || '',
      priceTo:         project?.priceTo || '',
      bedrooms:        project?.bedrooms || '',
      handoverQuarter: project?.handoverQuarter || '',
      handoverYear:    project?.handoverYear || '',
      paymentPlan:     project?.paymentPlan || '',
      permitNumber:    project?.permitNumber || '',
      status:          project?.status || 'upcoming',
      isFeatured:      project?.isFeatured || false,
    },
  })

  const onDropCover = useCallback(async (accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const res = await uploadAPI.image(fd)
      if (res.data.success) setCoverImage(res.data.data.url)
      else toast.error('Upload failed')
    } catch (err: any) {
      toast.error(err?.error || 'Failed to upload image')
    } finally {
      setUploadingCover(false)
    }
  }, [])
  const coverDropzone = useDropzone({
    onDrop: onDropCover,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/gif': [], 'image/avif': [] },
    maxSize: 10 * 1024 * 1024, multiple: false,
  })

  const onDropGallery = useCallback(async (accepted: File[]) => {
    if (accepted.length === 0) return
    setUploadingGallery(true)
    try {
      const uploaded: string[] = []
      for (const file of accepted) {
        const fd = new FormData(); fd.append('image', file)
        const res = await uploadAPI.image(fd)
        if (res.data.success) uploaded.push(res.data.data.url)
      }
      setGallery(prev => [...prev, ...uploaded])
    } catch (err: any) {
      toast.error(err?.error || 'Failed to upload one or more images')
    } finally {
      setUploadingGallery(false)
    }
  }, [])
  const galleryDropzone = useDropzone({
    onDrop: onDropGallery,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/gif': [], 'image/avif': [] },
    maxSize: 10 * 1024 * 1024, multiple: true,
  })

  const removeGalleryImage = (i: number) => setGallery(g => g.filter((_, idx) => idx !== i))

  const onSubmit = async (data: any) => {
    setSubmitting(true)
    const payload: any = {
      title: data.title, developer: data.developer,
      description: blocksToHtml(blocks),
      coverImage, images: gallery.map(url => ({ url })),
      area: data.area, community: data.community || undefined, city: data.city, emirate: data.emirate,
      priceFrom: Number(data.priceFrom), priceTo: data.priceTo !== '' ? Number(data.priceTo) : undefined,
      bedrooms: data.bedrooms,
      handoverQuarter: data.handoverQuarter || undefined,
      handoverYear: data.handoverYear ? Number(data.handoverYear) : undefined,
      paymentPlan: data.paymentPlan || undefined,
      permitNumber: data.permitNumber || undefined,
      permitQrImage: permitQrImage || undefined,
      status: data.status,
      isFeatured: !!data.isFeatured,
    }

    try {
      if (project) await projectAPI.update(project._id, payload)
      else await projectAPI.create(payload)
      toast.success(project ? 'Updated' : 'Created')
      onSaved(); onClose()
    } catch (err: any) {
      toast.error(err?.error || 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        className="w-full h-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>

        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{project ? 'Edit' : 'New'} Project</h2>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm p-2"><X size={14} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Main column */}
          <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-4">
            <div>
              <input
                className="input text-lg font-bold" style={{ padding: '12px 14px' }}
                placeholder="e.g. Boulevard Point" {...register('title', { required: true })}
              />
              {errors.title && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>Title is required</p>}
            </div>
            <select className="select-field w-full" {...register('developer', { required: true })}>
              <option value="">Select a developer…</option>
              {project?.developer && !developers.some(d => d.name === project.developer) && (
                <option value={project.developer}>{project.developer} (not in Developers list)</option>
              )}
              {developers.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
            </select>
            {errors.developer && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>Developer is required</p>}
            <a href="/admin/developers" target="_blank" rel="noopener noreferrer" className="text-xs inline-block" style={{ color: 'var(--teal)' }}>
              + Add a new developer
            </a>

            <BlockEditor blocks={blocks} onChange={setBlocks} />

            <Field label="Gallery Images">
              <div {...galleryDropzone.getRootProps()} className="rounded-xl p-5 text-center cursor-pointer transition-colors"
                style={{ border: `2px dashed ${galleryDropzone.isDragActive ? 'var(--teal)' : 'var(--border)'}`, background: galleryDropzone.isDragActive ? 'rgba(49,178,222,0.05)' : 'var(--bg-alt)' }}>
                <input {...galleryDropzone.getInputProps()} />
                {uploadingGallery ? <Loader2 size={18} className="animate-spin mx-auto" style={{ color: 'var(--teal)' }} /> : (
                  <>
                    <UploadCloud size={18} style={{ color: 'var(--teal)', margin: '0 auto 6px' }} />
                    <p className="text-xs" style={{ color: 'var(--text)' }}>Drag & drop images, or click to browse</p>
                  </>
                )}
              </div>
              {gallery.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
                  {gallery.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeGalleryImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Field>
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-80 flex-shrink-0 overflow-y-auto p-5 space-y-4" style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface)' }}>
            <button type="submit" disabled={submitting || uploadingCover} className="btn-primary w-full justify-center">
              {submitting ? 'Saving…' : project ? 'Save Changes' : 'Create'}
            </button>

            <div className="card p-4 space-y-3">
              <Field label="Cover Image">
                {coverImage ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                    <img src={coverImage} alt="" className="w-full h-32 object-cover" />
                    <button type="button" onClick={() => setCoverImage('')}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div {...coverDropzone.getRootProps()} className="rounded-xl p-5 text-center cursor-pointer transition-colors"
                    style={{ border: `2px dashed ${coverDropzone.isDragActive ? 'var(--teal)' : 'var(--border)'}`, background: coverDropzone.isDragActive ? 'rgba(49,178,222,0.05)' : 'var(--bg-alt)' }}>
                    <input {...coverDropzone.getInputProps()} />
                    {uploadingCover ? <Loader2 size={18} className="animate-spin mx-auto" style={{ color: 'var(--teal)' }} /> : (
                      <>
                        <UploadCloud size={18} style={{ color: 'var(--teal)', margin: '0 auto 6px' }} />
                        <p className="text-xs" style={{ color: 'var(--text)' }}>Drag & drop, or click</p>
                      </>
                    )}
                  </div>
                )}
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Area *">
                  <input className="input" {...register('area', { required: true })} />
                </Field>
                <Field label="Community (optional)">
                  <select className="select-field" {...register('community')}>
                    <option value="">— None —</option>
                    {DUBAI_COMMUNITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              {errors.area && <p className="text-xs" style={{ color: '#FB7185' }}>Area is required</p>}
              <div className="grid grid-cols-2 gap-3">
                <Field label="City">
                  <input className="input" {...register('city')} />
                </Field>
                <Field label="Emirate">
                  <select className="select-field" {...register('emirate')}>
                    {UAE_EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Price From (AED) *">
                  <input className="input" type="number" {...register('priceFrom', { required: true, min: 1 })} />
                </Field>
                <Field label="Price To (AED)">
                  <input className="input" type="number" {...register('priceTo')} />
                </Field>
              </div>
              {errors.priceFrom && <p className="text-xs" style={{ color: '#FB7185' }}>Starting price is required</p>}

              <Field label="Bedrooms">
                <input className="input" placeholder="e.g. Studio - 3BR" {...register('bedrooms')} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Handover Quarter">
                  <input className="input" placeholder="e.g. Q4" {...register('handoverQuarter')} />
                </Field>
                <Field label="Handover Year">
                  <input className="input" type="number" placeholder="e.g. 2027" {...register('handoverYear')} />
                </Field>
              </div>

              <Field label="Payment Plan">
                <input className="input" placeholder="e.g. 60/40 Post-Handover" {...register('paymentPlan')} />
              </Field>

              <Field label="DLD Permit Number">
                <input className="input" {...register('permitNumber')} />
              </Field>

              <Field label="DLD Permit QR Code (optional — the real QR from the permit certificate)">
                {permitQrImage ? (
                  <div className="relative inline-flex">
                    <img src={permitQrImage} alt="Permit QR" className="w-16 h-16 rounded-lg object-cover" style={{ border: '1px solid var(--border)' }} />
                    <button type="button" onClick={() => setPermitQrImage('')}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <div {...qrDropzone.getRootProps()} className="rounded-xl p-3 text-center cursor-pointer transition-colors inline-flex items-center gap-2 px-4"
                    style={{ border: `2px dashed ${qrDropzone.isDragActive ? 'var(--teal)' : 'var(--border)'}`, background: qrDropzone.isDragActive ? 'rgba(49,178,222,0.05)' : 'var(--bg-alt)' }}>
                    <input {...qrDropzone.getInputProps()} />
                    {uploadingQr ? <Loader2 size={15} className="animate-spin" style={{ color: 'var(--teal)' }} /> : <QrCode size={15} style={{ color: 'var(--teal)' }} />}
                    <span className="text-xs" style={{ color: 'var(--text)' }}>Upload QR image</span>
                  </div>
                )}
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  Falls back to an auto-generated QR of the number above when left blank.
                </p>
              </Field>

              <Field label="Status">
                <select className="select-field" {...register('status')}>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>

              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-mid)' }}>
                <input type="checkbox" {...register('isFeatured')} />
                Feature on homepage
              </label>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ══════════════════════════ Page ══════════════════════════

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Project | null | 'new'>(null)

  const load = useCallback(() => {
    setLoading(true)
    projectAPI.getAll({ limit: 100 })
      .then(r => { if (r.data.success) setProjects(r.data.data.data || []) })
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const remove = async (project: Project) => {
    if (!confirm(`Delete "${project.title}"?`)) return
    try { await projectAPI.delete(project._id); toast.success('Deleted'); load() }
    catch (err: any) { toast.error(err?.error || 'Failed to delete') }
  }

  return (
    <div>
      <header className="flex items-center justify-between px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Projects</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Off-plan & new development listings</p>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary btn-sm gap-2">
          <Plus size={13} /> New Project
        </button>
      </header>

      <div className="p-7">
        {loading ? (
          <div className="space-y-3">{Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-16 rounded-2xl" />)}</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No projects yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map(project => (
              <div key={project._id} className="card p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                  {project.coverImage && <img src={project.coverImage} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                    {project.title}
                    {project.isFeatured && <Star size={11} style={{ color: '#F59E0B' }} fill="#F59E0B" />}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                    {project.developer} · {project.area} · from {formatPrice(project.priceFrom)}
                    {' · '}<Eye size={10} className="inline" /> {project.views}
                  </p>
                </div>
                <span className="badge badge-gray capitalize">{project.status.replace('_', ' ')}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setEditing(project)} className="btn-ghost btn-sm p-2"><Pencil size={13} /></button>
                  <button onClick={() => remove(project)} className="btn-ghost btn-sm p-2" style={{ color: '#FB7185' }}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <ProjectForm
            project={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={load}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
