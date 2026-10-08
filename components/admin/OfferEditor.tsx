'use client'
import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { Loader2, UploadCloud, X, Plus, Sparkles } from 'lucide-react'
import { uploadAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { GIFTS, GIFT_KINDS, liveOffer, discountOf } from '@/lib/offer'
import type { Offer, GiftKind } from '@/types'

// Admin: the limited-time offer of a listing or a project — offer price, period, gifts and the offer's own card
// picture. Used by both forms; the parent keeps the value and sends it with the rest of the form.

const toInput = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : '')
// A day picked in the form: the start counts from the beginning of that day, the end until its last minute.
const fromInput = (v: string, end = false) => (v ? new Date(`${v}T${end ? '23:59:59' : '00:00:00'}`).toISOString() : undefined)

// `developer`: the offer applies to all of a developer's projects — a discount percentage instead of a fixed price,
// and no card picture (one picture cannot stand for every project).
export default function OfferEditor({ value, onChange, normalPrice, priceLabel = 'normal price', developer = false }: {
  value: Offer | null; onChange: (o: Offer | null) => void; normalPrice: number; priceLabel?: string; developer?: boolean
}) {
  const o: Offer = value || { enabled: false }
  // A brand-new offer switches itself on as soon as something is entered — filling the details in and forgetting the
  // switch left offers saved but invisible. Once the admin has used the switch, or the offer already existed, it is
  // never changed for them.
  const [switchTouched, setSwitchTouched] = useState(!!value)
  const set = (patch: Partial<Offer>) => onChange({ ...o, ...patch, ...(!switchTouched && !('enabled' in patch) ? { enabled: true } : {}) })
  const [uploading, setUploading] = useState(false)
  const [gift, setGift] = useState<{ kind: GiftKind; label: string }>({ kind: 'car', label: '' })

  const drop = useDropzone({
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] }, maxSize: 8 * 1024 * 1024, multiple: false,
    onDrop: async files => {
      if (!files[0]) return
      setUploading(true)
      try {
        const fd = new FormData(); fd.append('image', files[0])
        const res = await uploadAPI.image(fd)
        if (res.data.success) set({ thumbnail: res.data.data.url }); else toast.error('Upload failed')
      } catch (err: any) { toast.error(err?.error || 'Failed to upload the offer picture') } finally { setUploading(false) }
    },
  })
  const addGift = (kind: GiftKind, label: string) => {
    const text = label.trim() || GIFTS[kind].label
    if ((o.gifts || []).some(g => g.label.toLowerCase() === text.toLowerCase())) return
    set({ gifts: [...(o.gifts || []), { kind, label: text }].slice(0, 8) })
    setGift({ kind, label: '' })
  }

  const pct = discountOf(o)
  const pctPrice = pct && normalPrice > 0 ? Math.round(normalPrice * (100 - pct) / 100) : 0
  const price = Number(o.price) || 0
  const priceError = price > 0 && normalPrice > 0 && price >= normalPrice
  const dateError = !!o.startsAt && !!o.endsAt && new Date(o.endsAt) <= new Date(o.startsAt)
  const now = new Date()
  const state = !o.enabled ? 'Off' : liveOffer({ offer: o }) ? 'Live now' : o.startsAt && new Date(o.startsAt) > now ? 'Scheduled' : o.endsAt && new Date(o.endsAt) < now ? 'Ended' : 'Add an offer price, plan, waiver or gift'
  const label = 'block text-[11px] font-semibold mb-1'

  return (
    <div className="rounded-xl p-4 space-y-4" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text)' }}><Sparkles size={13} style={{ color: '#CB0101' }} /> {developer ? 'Developer Offer — all projects' : 'Limited-Time Offer'}</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{developer ? 'Applies to ALL projects of this developer while it is running — each project shows its own offer price worked out from the discount. A project with its own offer keeps that one.' : 'Shown as a highlighted card in the lists and in the home page offers row while it is running. Enter only what is really on offer.'}</p>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer flex-shrink-0" style={{ color: 'var(--text)' }}>
          <input type="checkbox" checked={!!o.enabled} onChange={e => { setSwitchTouched(true); set({ enabled: e.target.checked }) }} /> Offer on
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: state === 'Live now' ? '#047857' : '#B45309', background: state === 'Live now' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)' }}>{state}</span>
        </label>
      </div>

      {/* Details are filled in but the switch is off: say so plainly, with one click to fix it. */}
      {!o.enabled && (Number(o.price) > 0 || pct > 0 || (o.gifts?.length || 0) > 0 || !!o.paymentPlan || !!o.dldWaiver) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-2.5" style={{ background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.5)' }}>
          <p className="text-xs font-semibold" style={{ color: '#92400E' }}>This offer is switched OFF — it is not shown on the website{developer ? ' on any project' : ''}.</p>
          <button type="button" className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#CB0101' }} onClick={() => { setSwitchTouched(true); set({ enabled: true }) }}>Switch the offer on</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label} style={{ color: 'var(--text-mid)' }}>Offer title</label>
          <input className="input" maxLength={80} placeholder="e.g. National Day Offer" value={o.title || ''} onChange={e => set({ title: e.target.value })} />
        </div>
        <div>
          <label className={label} style={{ color: 'var(--text-mid)' }}>Discount (%) — the offer price is calculated automatically</label>
          <input className="input" type="number" min={0} max={90} step="any" placeholder="e.g. 20" value={o.discountPercent || ''}
            onChange={e => { const n = Number(e.target.value); set({ discountPercent: n > 0 ? Math.min(90, n) : undefined, ...(n > 0 ? { price: undefined } : {}) }) }} />
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {[5, 10, 15, 20, 25, 30].map(n => (
              <button key={n} type="button" className="px-2.5 py-1 rounded-full text-[11px] font-medium" onClick={() => set({ discountPercent: n, price: undefined })}
                style={{ background: pct === n ? 'rgba(203,1,1,0.10)' : 'var(--surface)', border: `1px solid ${pct === n ? 'rgba(203,1,1,0.4)' : 'var(--border)'}`, color: pct === n ? '#CB0101' : 'var(--text-mid)' }}>{n}% off</button>
            ))}
          </div>
          {pct > 0 && (developer
            ? <p className="text-[11px] mt-1 font-medium" style={{ color: '#047857' }}>Every project shows its price less {pct}% — e.g. AED 1,000,000 becomes AED {(Math.round(1_000_000 * (100 - pct) / 100)).toLocaleString('en-US')}.</p>
            : pctPrice > 0 && <p className="text-[11px] mt-1 font-medium" style={{ color: '#047857' }}>Offer price {formatPrice(pctPrice)} (AED {pctPrice.toLocaleString('en-US')}) — {pct}% off {formatPrice(normalPrice)}</p>)}
        </div>
        {!developer && (
        <div>
          <label className={label} style={{ color: 'var(--text-mid)' }}>…or a fixed offer price (AED)</label>
          <input className="input" type="number" placeholder={`Lower than the ${priceLabel}`} value={pct ? '' : o.price || ''} disabled={pct > 0}
            onChange={e => set({ price: Number(e.target.value) > 0 ? Number(e.target.value) : undefined, discountPercent: undefined })} />
          {pct > 0 && <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Clear the discount % to type a fixed price instead.</p>}
          {!pct && price > 0 && !priceError && normalPrice > 0 && <p className="text-[11px] mt-1 font-medium" style={{ color: '#047857' }}>{formatPrice(price)} · {Math.round(((normalPrice - price) / normalPrice) * 100)}% off {formatPrice(normalPrice)}</p>}
          {priceError && <p className="text-[11px] mt-1" style={{ color: '#B45309' }}>The offer price must be lower than the {priceLabel} ({formatPrice(normalPrice)}).</p>}
        </div>
        )}
        <div>
          <label className={label} style={{ color: 'var(--text-mid)' }}>Starts</label>
          <input className="input" type="date" value={toInput(o.startsAt)} onChange={e => set({ startsAt: fromInput(e.target.value) })} />
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Empty = starts now.</p>
        </div>
        <div>
          <label className={label} style={{ color: 'var(--text-mid)' }}>Ends (last day)</label>
          <input className="input" type="date" value={toInput(o.endsAt)} onChange={e => set({ endsAt: fromInput(e.target.value, true) })} />
          {dateError ? <p className="text-[11px] mt-1" style={{ color: '#B45309' }}>The end must be after the start.</p> : <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Empty = until you switch it off. After this day the listing goes back to normal by itself.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label} style={{ color: 'var(--text-mid)' }}>Payment plan offer — optional</label>
          <input className="input" maxLength={120} placeholder="e.g. 1% monthly · 60/40 post-handover" value={o.paymentPlan || ''} onChange={e => set({ paymentPlan: e.target.value })} />
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>A special plan the developer / owner gives during the offer. The normal payment plan stays as it is.</p>
        </div>
        <div>
          <label className={label} style={{ color: 'var(--text-mid)' }}>DLD fee waiver — optional</label>
          <input className="input" maxLength={80} placeholder="e.g. 100% DLD fee waived" value={o.dldWaiver || ''} onChange={e => set({ dldWaiver: e.target.value })} />
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {['100% DLD fee waived', '50% DLD fee waived', '4% DLD fee paid by developer'].map(x => (
              <button key={x} type="button" className="px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' }} onClick={() => set({ dldWaiver: x })}>{x}</button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className={label} style={{ color: 'var(--text-mid)' }}>Gifts included (car, Golden Visa, furniture…)</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(o.gifts || []).map(g => {
            const Icon = (GIFTS[g.kind] || GIFTS.other).icon
            return (
              <span key={g.label} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[11px] font-semibold" style={{ color: '#92400E', background: 'rgba(245,158,11,0.16)', border: '1px solid rgba(245,158,11,0.45)' }}>
                <Icon size={11} /> {g.label}
                <button type="button" aria-label={`Remove ${g.label}`} onClick={() => set({ gifts: (o.gifts || []).filter(x => x.label !== g.label) })} className="p-0.5"><X size={11} /></button>
              </span>
            )
          })}
          {!(o.gifts || []).length && <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>None added.</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="input text-xs w-auto" value={gift.kind} onChange={e => setGift({ ...gift, kind: e.target.value as GiftKind })}>
            {GIFT_KINDS.filter(k => k !== 'dld_waiver').map(k => <option key={k} value={k}>{GIFTS[k].label}</option>)}
          </select>
          <input className="input text-xs flex-1 min-w-[180px]" maxLength={80} placeholder="Exact wording, e.g. Free Tesla Model 3 (optional)" value={gift.label}
            onChange={e => setGift({ ...gift, label: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGift(gift.kind, gift.label) } }} />
          <button type="button" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onClick={() => addGift(gift.kind, gift.label)}><Plus size={12} /> Add gift</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={developer ? 'hidden' : ''}>
          <label className={label} style={{ color: 'var(--text-mid)' }}>Offer picture (card thumbnail)</label>
          {o.thumbnail ? (
            <div className="relative inline-flex">
              <img src={o.thumbnail} alt="Offer thumbnail" className="h-28 w-44 rounded-lg object-cover" style={{ border: '1px solid var(--border)' }} />
              <button type="button" onClick={() => set({ thumbnail: undefined })} aria-label="Remove offer picture"
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.6)' }}><X size={11} /></button>
            </div>
          ) : (
            <div {...drop.getRootProps()} className="rounded-xl p-4 text-center cursor-pointer" style={{ border: `2px dashed ${drop.isDragActive ? 'var(--teal)' : 'var(--border)'}`, background: 'var(--surface)' }}>
              <input {...drop.getInputProps()} />
              {uploading ? <Loader2 size={16} className="animate-spin mx-auto" style={{ color: 'var(--teal)' }} /> : <UploadCloud size={16} className="mx-auto" style={{ color: 'var(--teal)' }} />}
              <p className="text-xs mt-1" style={{ color: 'var(--text)' }}>Upload the offer picture</p>
            </div>
          )}
          <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>Replaces the card photo in the lists and on the home page while the offer is live. It is not added to the gallery on the detail page.</p>
        </div>
        <div>
          <label className={label} style={{ color: 'var(--text-mid)' }}>Conditions / note (shown on the detail page)</label>
          <textarea className="input w-full" rows={4} maxLength={240} placeholder="e.g. Valid for bookings with a 20% down payment. Golden Visa subject to government approval." value={o.note || ''} onChange={e => set({ note: e.target.value })} />
        </div>
      </div>
      {value && <button type="button" className="text-[11px] font-semibold underline" style={{ color: 'var(--text-muted)' }} onClick={() => onChange(null)}>Remove this offer completely</button>}
    </div>
  )
}
