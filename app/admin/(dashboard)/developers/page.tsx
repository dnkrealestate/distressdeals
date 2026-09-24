'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import {
  Plus, X, Trash2, Pencil, Building2, UploadCloud, Loader2, Star, Globe, Layers,
  Sparkles, Wand2, AlertTriangle, Image as ImageIcon,
} from 'lucide-react'
import { developerAPI, uploadAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import type { Developer, DeveloperWithStats, DeveloperImport } from '@/types'
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
  const [logoWhite, setLogoWhite] = useState(developer?.logoWhite || '')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [processingUrl, setProcessingUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [importUrl, setImportUrl] = useState(developer?.website || '')
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState<DeveloperImport | null>(null)

  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm({
    defaultValues: {
      name:            developer?.name || '',
      website:         developer?.website || '',
      establishedYear: developer?.establishedYear || '',
      headquarters:    developer?.headquarters || '',
      description:     developer?.description || '',
      isFeatured:      developer?.isFeatured || false,
    },
  })

  // Reads the developer's site: fills every field, and stores their logo (colour + white WebP).
  const autoFill = async () => {
    if (!importUrl.trim()) { toast.error("Enter the developer's website first"); return }
    const hasText = !!(getValues('description') || '').trim()
    if (hasText && !confirm('Replace the current details with what the AI finds on the website?')) return
    setImporting(true)
    try {
      const res = await developerAPI.aiImport(importUrl.trim())
      const d: DeveloperImport = res.data.data
      setImported(d)
      setValue('name', d.name, { shouldDirty: true, shouldValidate: true })
      setValue('website', d.website, { shouldDirty: true })
      setValue('establishedYear', (d.establishedYear ?? '') as any, { shouldDirty: true })
      setValue('headquarters', d.headquarters || '', { shouldDirty: true })
      setValue('description', d.description, { shouldDirty: true })
      if (d.logo) { setLogo(d.logo); setLogoWhite(d.logoWhite || '') }
      toast.success(d.logo ? 'Details and logo filled in — review before saving' : 'Details filled in — no logo found, upload one below')
    } catch (err: any) {
      toast.error(err?.code === 'ECONNABORTED' ? 'The website took too long to read — try again' : err?.error || 'Could not read that website')
    } finally {
      setImporting(false)
    }
  }

  // Any logo (a detected alternative, or an upload) → stored colour + white versions.
  const applyLogoFrom = async (url: string) => {
    setProcessingUrl(url)
    try {
      const res = await developerAPI.processLogo(url, getValues('name'))
      setLogo(res.data.data.logo)
      setLogoWhite(res.data.data.logoWhite)
    } catch (err: any) {
      toast.error(err?.error || 'Could not use that image as a logo')
    } finally {
      setProcessingUrl(null)
    }
  }

  const onDropLogo = useCallback(async (accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const res = await uploadAPI.image(fd)
      if (!res.data.success) { toast.error('Upload failed'); return }
      setLogo(res.data.data.url)
      // Trim it, knock out any solid background, and make the white version too.
      await applyLogoFrom(res.data.data.url)
    } catch (err: any) {
      toast.error(err?.error || 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const logoDropzone = useDropzone({
    onDrop: onDropLogo,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/svg+xml': [] },
    maxSize: 5 * 1024 * 1024, multiple: false,
  })

  const onSubmit = async (data: any) => {
    setSubmitting(true)
    const payload: any = {
      name: data.name, logo, logoWhite, description: data.description,
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

  const duplicate = imported?.existing && imported.existing._id !== developer?._id ? imported.existing : null
  const busyLogo = uploadingLogo || !!processingUrl

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>

        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{developer ? 'Edit' : 'New'} Developer</h2>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm p-2"><X size={14} /></button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') e.preventDefault() }}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {/* ── Auto-fill from website ── */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(203,1,1,0.04)', border: '1px solid rgba(203,1,1,0.2)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={15} style={{ color: 'var(--teal)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Auto-fill from website</p>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              Paste the developer's website. AI reads it and fills in the name, description, year founded and headquarters. It also saves their logo as WebP, in colour and in white.
            </p>
            <div className="flex gap-2">
              <input
                className="input flex-1" placeholder="e.g. emaar.com" value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); autoFill() } }}
              />
              <button type="button" onClick={autoFill} disabled={importing} className="btn-primary gap-2 flex-shrink-0">
                {importing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                {importing ? 'Reading website…' : 'Auto-fill'}
              </button>
            </div>
            {importing && <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>This usually takes 5–20 seconds.</p>}
            {imported && !importing && (
              <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
                Read {imported.pagesRead.length} page{imported.pagesRead.length === 1 ? '' : 's'} from {imported.website.replace(/^https?:\/\//, '')}.
                {imported.logoError && !imported.logo && <span style={{ color: '#D97706' }}> No logo could be read ({imported.logoError}). Upload one below.</span>}
              </p>
            )}
            {duplicate && (
              <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: '#D97706' }}>
                <AlertTriangle size={13} /> "{duplicate.name}" is already in your developers list. Edit that one instead of creating a duplicate.
              </p>
            )}
          </div>

          {/* ── Logo: colour + white ── */}
          <Field label="Logo">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="relative h-24 rounded-xl flex items-center justify-center p-3" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
                  {logo ? <img src={logo} alt="Logo" className="max-h-full max-w-full object-contain" /> : <ImageIcon size={18} style={{ color: '#94A3B8' }} />}
                  {busyLogo && <div className="absolute inset-0 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.7)' }}><Loader2 size={16} className="animate-spin" style={{ color: 'var(--teal)' }} /></div>}
                </div>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>For light backgrounds</p>
              </div>
              <div>
                <div className="relative h-24 rounded-xl flex items-center justify-center p-3" style={{ background: '#1E293B' }}>
                  {logoWhite ? <img src={logoWhite} alt="White logo" className="max-h-full max-w-full object-contain" /> : <ImageIcon size={18} style={{ color: '#475569' }} />}
                </div>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>White version, for dark backgrounds</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <div {...logoDropzone.getRootProps()} className="btn-outline btn-sm gap-1.5 cursor-pointer">
                <input {...logoDropzone.getInputProps()} />
                <UploadCloud size={13} /> {logo ? 'Upload a different logo' : 'Upload logo'}
              </div>
              {logo && (
                <button type="button" onClick={() => { setLogo(''); setLogoWhite('') }} className="btn-ghost btn-sm gap-1.5" style={{ color: '#FB7185' }}>
                  <Trash2 size={13} /> Remove
                </button>
              )}
            </div>
            {imported && imported.logoCandidates.length > 1 && (
              <div className="mt-3">
                <p className="text-[11px] mb-1.5" style={{ color: 'var(--text-muted)' }}>Wrong logo? Other images found on the site. Click one to use it:</p>
                <div className="flex gap-2 flex-wrap">
                  {imported.logoCandidates.map(url => (
                    <button
                      key={url} type="button" onClick={() => applyLogoFrom(url)} disabled={busyLogo}
                      className="w-24 h-14 rounded-lg flex items-center justify-center p-1.5 transition-opacity hover:opacity-80 disabled:opacity-40"
                      style={{ background: 'repeating-conic-gradient(#64748b 0% 25%, #94a3b8 0% 50%) 50% / 12px 12px', border: `1px solid ${processingUrl === url ? 'var(--teal)' : 'var(--border)'}` }}
                      title={url}
                    >
                      {processingUrl === url
                        ? <Loader2 size={14} className="animate-spin" style={{ color: 'var(--teal)' }} />
                        : <img src={url} alt="" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />}
                    </button>
                  ))}
                </div>
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
            <textarea className="input" rows={7} placeholder="Short profile shown on the developer's page" {...register('description')} />
          </Field>

          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-mid)' }}>
            <input type="checkbox" {...register('isFeatured')} />
            Feature this developer
          </label>

          <button type="submit" disabled={submitting || busyLogo || importing} className="btn-primary w-full justify-center">
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
                  {dev.logo ? <img src={dev.logo} alt="" className="w-full h-full object-contain p-1.5" /> : <Building2 size={20} style={{ color: 'var(--teal)', opacity: 0.5 }} />}
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
