'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import {
  Plus, X, Trash2, Pencil, Building2, UploadCloud, Loader2, Star, Globe, Layers,
} from 'lucide-react'
import { developerAPI, uploadAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import type { Developer, DeveloperWithStats } from '@/types'
import toast from 'react-hot-toast'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>{label}</label>
      {children}
    </div>
  )
}

// ══════════════════════════ Form ══════════════════════════

function DeveloperForm({ developer, onClose, onSaved }: { developer: Developer | null; onClose: () => void; onSaved: () => void }) {
  const [logo, setLogo] = useState(developer?.logo || '')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name:            developer?.name || '',
      website:         developer?.website || '',
      establishedYear: developer?.establishedYear || '',
      headquarters:    developer?.headquarters || '',
      description:     developer?.description || '',
      isFeatured:      developer?.isFeatured || false,
    },
  })

  const onDropLogo = useCallback(async (accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const res = await uploadAPI.image(fd)
      if (res.data.success) setLogo(res.data.data.url)
      else toast.error('Upload failed')
    } catch (err: any) {
      toast.error(err?.error || 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }, [])
  const logoDropzone = useDropzone({
    onDrop: onDropLogo,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/svg+xml': [] },
    maxSize: 5 * 1024 * 1024, multiple: false,
  })

  const onSubmit = async (data: any) => {
    setSubmitting(true)
    const payload: any = {
      name: data.name, logo, description: data.description,
      website: data.website || undefined,
      establishedYear: data.establishedYear ? Number(data.establishedYear) : undefined,
      headquarters: data.headquarters || undefined,
      isFeatured: !!data.isFeatured,
    }
    try {
      if (developer) await developerAPI.update(developer._id, payload)
      else await developerAPI.create(payload)
      toast.success(developer ? 'Updated' : 'Created')
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
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>

        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{developer ? 'Edit' : 'New'} Developer</h2>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm p-2"><X size={14} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          <Field label="Logo">
            {logo ? (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                <img src={logo} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setLogo('')}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
                  <X size={11} />
                </button>
              </div>
            ) : (
              <div {...logoDropzone.getRootProps()} className="rounded-xl p-5 text-center cursor-pointer transition-colors w-40"
                style={{ border: `2px dashed ${logoDropzone.isDragActive ? 'var(--teal)' : 'var(--border)'}`, background: logoDropzone.isDragActive ? 'rgba(203,1,1,0.05)' : 'var(--bg-alt)' }}>
                <input {...logoDropzone.getInputProps()} />
                {uploadingLogo ? <Loader2 size={16} className="animate-spin mx-auto" style={{ color: 'var(--teal)' }} /> : (
                  <>
                    <UploadCloud size={16} style={{ color: 'var(--teal)', margin: '0 auto 4px' }} />
                    <p className="text-[11px]" style={{ color: 'var(--text)' }}>Upload logo</p>
                  </>
                )}
              </div>
            )}
          </Field>

          <Field label="Developer Name *">
            <input className="input" placeholder="e.g. Emaar Properties" {...register('name', { required: true })} />
          </Field>
          {errors.name && <p className="text-xs" style={{ color: '#FB7185' }}>Name is required</p>}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Website">
              <input className="input" placeholder="https://…" {...register('website')} />
            </Field>
            <Field label="Established Year">
              <input className="input" type="number" placeholder="e.g. 1997" {...register('establishedYear')} />
            </Field>
          </div>

          <Field label="Headquarters">
            <input className="input" placeholder="e.g. Dubai, UAE" {...register('headquarters')} />
          </Field>

          <Field label="Description">
            <textarea className="input" rows={4} placeholder="Short profile shown on the developer's page" {...register('description')} />
          </Field>

          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-mid)' }}>
            <input type="checkbox" {...register('isFeatured')} />
            Feature this developer
          </label>

          <button type="submit" disabled={submitting || uploadingLogo} className="btn-primary w-full justify-center">
            {submitting ? 'Saving…' : developer ? 'Save Changes' : 'Create'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// ══════════════════════════ Page ══════════════════════════

export default function AdminDevelopersPage() {
  const [developers, setDevelopers] = useState<DeveloperWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Developer | null | 'new'>(null)

  const load = useCallback(() => {
    setLoading(true)
    developerAPI.getAll()
      .then(r => { if (r.data.success) setDevelopers(r.data.data || []) })
      .catch(() => toast.error('Failed to load developers'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const remove = async (developer: Developer) => {
    if (!confirm(`Delete "${developer.name}"? Existing projects keep this name as free text but will lose the logo link.`)) return
    try { await developerAPI.delete(developer._id); toast.success('Deleted'); load() }
    catch (err: any) { toast.error(err?.error || 'Failed to delete') }
  }

  return (
    <div>
      <header className="flex items-center justify-between px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Developers</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage the developer profiles used across off-plan projects</p>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary btn-sm gap-2">
          <Plus size={13} /> New Developer
        </button>
      </header>

      <div className="p-7">
        {loading ? (
          <div className="space-y-3">{Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-16 rounded-2xl" />)}</div>
        ) : developers.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No developers yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {developers.map(dev => (
              <div key={dev._id} className="card p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-alt)' }}>
                  {dev.logo ? <img src={dev.logo} alt="" className="w-full h-full object-cover" /> : <Building2 size={20} style={{ color: 'var(--teal)', opacity: 0.5 }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                    {dev.name}
                    {dev.isFeatured && <Star size={11} style={{ color: '#F59E0B' }} fill="#F59E0B" />}
                  </p>
                  <p className="text-xs mt-0.5 truncate flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1"><Layers size={10} /> {dev.projectCount} project{dev.projectCount === 1 ? '' : 's'}</span>
                    {dev.minPriceFrom > 0 && <span>from {formatPrice(dev.minPriceFrom)}</span>}
                    {dev.website && <span className="flex items-center gap-1"><Globe size={10} /> {dev.website.replace(/^https?:\/\//, '')}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setEditing(dev)} className="btn-ghost btn-sm p-2"><Pencil size={13} /></button>
                  <button onClick={() => remove(dev)} className="btn-ghost btn-sm p-2" style={{ color: '#FB7185' }}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <DeveloperForm
            developer={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={load}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
