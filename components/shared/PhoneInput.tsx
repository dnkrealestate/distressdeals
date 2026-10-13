'use client'
import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/max'
import { ChevronDown, Search, CheckCircle2, AlertCircle } from 'lucide-react'
import { COUNTRIES } from '@/lib/phoneCountries'
import { checkPhone, exampleNumber, splitDialCode, searchCountries, formatAsTyped, type PhoneKind } from '@/lib/phone'

// The phone field used everywhere: a country picker (flag + dialling code, searchable) and the number, formatted as it
// is typed. It always produces an international number ("+971501234567"), so a country code can't be left out, and it
// says straight away when the number does not exist for that country. Pasting "+44 7911 123456" or "0044…" switches
// the country by itself.
//
// `value` / `onChange` carry the full number ("+971501234567" — or "" when empty). Forms check it with `checkPhone` /
// `phoneRule` (lib/phone) before sending; the backend checks it again.

const flagUrl = (c: string) => `https://flagcdn.com/w40/${c.toLowerCase()}.png`
const PRIORITY = ['AE', 'SA', 'QA', 'KW', 'OM', 'BH', 'IN', 'PK', 'GB', 'US', 'RU', 'CN', 'EG', 'LB', 'JO', 'PH']

function split(value: string, fallback: CountryCode): { country: CountryCode; national: string } {
  const v = (value || '').trim()
  if (!v) return { country: fallback, national: '' }
  const pn = parsePhoneNumberFromString(v.startsWith('00') ? '+' + v.slice(2) : v, v.startsWith('+') || v.startsWith('00') ? undefined : fallback)
  if (pn?.country) return { country: pn.country, national: formatAsTyped(pn.country, pn.nationalNumber) }
  if (pn) return { country: fallback, national: pn.nationalNumber }
  return { country: fallback, national: v.replace(/^\+\d{1,3}\s*/, '') }
}

export interface PhoneInputProps {
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  kind?: PhoneKind               // 'mobile' where it must receive SMS / WhatsApp
  required?: boolean
  defaultCountry?: CountryCode
  error?: string                 // a message from the form (shown instead of the live one)
  disabled?: boolean
  id?: string
  name?: string
  className?: string
  /** Show the live "valid / not valid" line under the field (default on). */
  hint?: boolean
  autoFocus?: boolean
  onEnter?: () => void
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  { value, onChange, onBlur, kind = 'any', required = false, defaultCountry = 'AE', error, disabled, id, name, className = '', hint = true, autoFocus, onEnter }, ref,
) {
  const init = useMemo(() => split(value, defaultCountry), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [country, setCountry] = useState<CountryCode>(init.country)
  const [national, setNational] = useState(init.national)
  const [touched, setTouched] = useState(false)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const boxRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const lastEmitted = useRef(value)
  const dial = COUNTRIES.find(c => c[0] === country)?.[2] || ''

  // The form replaced the value (reset, user loaded) — show it.
  useEffect(() => {
    if (value === lastEmitted.current) return
    const s = split(value, country); setCountry(s.country); setNational(s.national); lastEmitted.current = value
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  // The country list is drawn on top of the page (a portal, fixed position under — or above — the field), so a modal
  // or a scrolling form around the field can never cut it off.
  const popRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<React.CSSProperties | null>(null)
  useLayoutEffect(() => {
    if (!open) { setPos(null); return }
    const place = () => {
      const r = boxRef.current?.getBoundingClientRect()
      if (!r) return
      const vw = window.innerWidth, vh = window.innerHeight
      const width = Math.min(Math.max(r.width, 280), 360, vw - 16)
      const left = Math.max(8, Math.min(r.left, vw - width - 8))
      const below = vh - r.bottom, above = r.top
      const up = below < 320 && above > below
      const maxHeight = Math.max(160, Math.min(340, (up ? above : below) - 12))
      setPos(up ? { left, width, bottom: vh - r.top + 4, maxHeight } : { left, width, top: r.bottom + 4, maxHeight })
    }
    place()
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true)
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true) }
  }, [open])
  useEffect(() => {
    if (!open) return
    setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 0)
    const close = (e: MouseEvent) => { const t = e.target as Node; if (!boxRef.current?.contains(t) && !popRef.current?.contains(t)) setOpen(false) }
    document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close)
  }, [open])

  const emit = (c: CountryCode, nat: string) => {
    const digits = nat.replace(/\D/g, '')
    const full = digits ? `+${COUNTRIES.find(r => r[0] === c)?.[2] || ''}${digits}` : ''
    lastEmitted.current = full; onChange(full)
  }

  const type = (raw: string) => {
    // A number typed or pasted with its own code ("+44 7911…", "0044…"): as soon as the code is complete it moves to
    // the picker and the rest stays in the box.
    if (/^\s*(\+|00)/.test(raw)) {
      const intl = '+' + raw.replace(/^\s*(\+|00)/, '').replace(/\D/g, '')
      const sp = splitDialCode(intl)
      if (!sp) { setNational(raw.trim().replace(/[^\d+]/g, '')); lastEmitted.current = ''; onChange(''); return }
      const c = parsePhoneNumberFromString(intl)?.country || sp.country
      setCountry(c); setNational(formatAsTyped(c, sp.rest)); emit(c, sp.rest)
      return
    }
    const t = raw.replace(/[^\d\s()-]/g, '')
    const digits = t.replace(/\D/g, '').slice(0, 17)
    // Format while typing forward; while deleting keep what is there, so backspace never fights the spacing.
    setNational(digits.length >= national.replace(/\D/g, '').length ? formatAsTyped(country, digits) : t)
    // A national trunk prefix ("0" in 050 123 4567) is dropped from the international number.
    emit(country, parsePhoneNumberFromString(digits, country)?.nationalNumber || digits)
  }

  const pick = (c: CountryCode) => {
    setCountry(c); setOpen(false); setQ('')
    const digits = national.replace(/\D/g, '')
    setNational(formatAsTyped(c, digits)); emit(c, parsePhoneNumberFromString(digits, c)?.nationalNumber || digits)
  }

  const live = checkPhone(value, { kind, required })
  const showLive = hint && touched && !!national.replace(/\D/g, '')
  const message = error || (showLive && !live.ok ? live.error : '')
  const list = useMemo(() => searchCountries(q, PRIORITY), [q])

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="input flex items-stretch p-0 overflow-hidden" style={{ borderColor: message ? 'rgba(239,68,68,0.55)' : showLive && live.ok ? 'rgba(22,163,74,0.5)' : undefined, opacity: disabled ? 0.6 : 1 }}>
        <button type="button" disabled={disabled} onClick={() => setOpen(o => !o)} aria-label={`Country code: +${dial}. Change country`} aria-haspopup="listbox" aria-expanded={open}
          className="flex items-center gap-1.5 pl-3 pr-2 flex-shrink-0 text-sm font-semibold" style={{ borderRight: '1px solid var(--border)', color: 'var(--text)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={flagUrl(country)} alt="" width={20} height={14} className="rounded-[2px] object-cover" style={{ width: 20, height: 14 }} />
          <span>+{dial}</span>
          <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
        </button>
        <input ref={ref} id={id} name={name} type="tel" inputMode="tel" autoComplete="tel-national" disabled={disabled} autoFocus={autoFocus}
          value={national} onChange={e => type(e.target.value)} onBlur={() => { setTouched(true); onBlur?.() }}
          onKeyDown={e => { if (e.key === 'Enter' && onEnter) { e.preventDefault(); setTouched(true); onEnter() } }}
          placeholder={exampleNumber(country).replace(/^\+\d+\s*/, '') || 'Phone number'}
          aria-invalid={!!message} className="flex-1 min-w-0 bg-transparent outline-none text-sm px-3 py-2.5" style={{ color: 'var(--text)' }} />
        {showLive && live.ok && <CheckCircle2 size={16} className="self-center mr-3 flex-shrink-0" style={{ color: '#16A34A' }} aria-label="Valid number" />}
      </div>
      {message && <p className="flex items-start gap-1 text-[11px] mt-1" style={{ color: '#DC2626' }} role="alert"><AlertCircle size={12} className="mt-px flex-shrink-0" />{message}</p>}

      {open && pos && createPortal(
        <div ref={popRef} className="fixed z-[1000] rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ ...pos, background: 'var(--surface)', border: '1px solid var(--border)' }} role="listbox">
          <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input ref={searchRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Search country or code"
              onKeyDown={e => { if (e.key === 'Enter' && list[0]) { e.preventDefault(); pick(list[0][0] as CountryCode) } if (e.key === 'Escape') setOpen(false) }}
              className="flex-1 bg-transparent outline-none text-sm" style={{ color: 'var(--text)' }} />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {list.map(([c, n, d], i) => (
              <button key={c} type="button" onClick={() => pick(c as CountryCode)} role="option" aria-selected={c === country}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-[var(--bg-alt)]"
                style={{ background: c === country ? 'rgba(203,1,1,0.06)' : undefined, borderTop: !q && i === PRIORITY.length ? '1px solid var(--border)' : undefined }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={flagUrl(c)} alt="" width={20} height={14} loading={i < 30 ? "eager" : "lazy"} className="rounded-[2px] object-cover flex-shrink-0" style={{ width: 20, height: 14 }} />
                <span className="flex-1 truncate" style={{ color: 'var(--text)' }}>{n}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+{d}</span>
              </button>
            ))}
            {list.length === 0 && <p className="px-3 py-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>No country found</p>}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
})

export default PhoneInput
