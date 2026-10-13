import { AsYouType, parsePhoneNumberFromString, validatePhoneNumberLength, getExampleNumber, type CountryCode } from 'libphonenumber-js/max'
import examples from 'libphonenumber-js/mobile/examples'
import { COUNTRIES } from './phoneCountries'

// The one phone-number checker for every phone field (same rules in mobile/utils/phone.ts and backend utils/phone.ts).
// Worldwide: the number must carry its country code, and it is checked against that country's real numbering plan
// (length, valid prefixes, mobile vs landline) — not just "8 to 15 digits". Obvious placeholders (0000000, 1234567)
// are refused too. A valid number is stored in E.164 form: "+971501234567".

export type PhoneKind = 'any' | 'mobile'
export interface PhoneCheck { ok: boolean; e164: string; country?: CountryCode; international?: string; error?: string }

export const countryName = (c?: string) => COUNTRIES.find(r => r[0] === c)?.[1] || c || ''
export const dialCode = (c: string) => COUNTRIES.find(r => r[0] === c)?.[2] || ''
export const exampleNumber = (c: CountryCode) => getExampleNumber(c, examples)?.formatInternational() || ''

// What people type to get past a form: "50 000 0000", "55 555 5555", "123456789". Kept narrow on purpose — a real
// number may well end in 1234567, so only a whole number of one repeated digit or one straight run is refused.
function looksFake(national: string): boolean {
  const d = national.replace(/\D/g, '')
  if (d.length < 7) return false
  if (/^(\d)\1+$/.test(d) || /^\d{1,2}(\d)\1{6,}$/.test(d)) return true
  return '01234567890123'.includes(d) || '98765432109876'.includes(d)
}

// The country a number belongs to from its dialling code alone (for a message about a number that does not parse).
// Codes several countries share ("+44" is also Guernsey, Jersey…) name the main one.
const MAIN: Record<string, CountryCode> = { '1': 'US', '7': 'RU', '44': 'GB', '47': 'NO', '61': 'AU', '212': 'MA', '262': 'RE', '290': 'SH', '358': 'FI', '590': 'GP', '599': 'CW' }
/** The dialling code at the start of "+<digits>" (codes never prefix one another), its country, and the rest. */
export function splitDialCode(s: string): { country: CountryCode; code: string; rest: string } | null {
  const d = s.replace(/\D/g, '')
  for (const len of [1, 2, 3]) {
    const code = d.slice(0, len)
    if (code.length < len) return null
    const country = MAIN[code] || (COUNTRIES.find(r => r[2] === code)?.[0] as CountryCode | undefined)
    if (country) return { country, code, rest: d.slice(len) }
  }
  return null
}
function countryFromDigits(s: string): CountryCode | undefined { return splitDialCode(s)?.country }

/** Countries matching a search ("ind", "+91", "AE"), best first: names starting with it, then the rest. */
export function searchCountries(q: string, priority: string[] = []): [string, string, string][] {
  const s = q.trim().toLowerCase().replace(/^\+/, '')
  if (!s) return [...priority.map(p => COUNTRIES.find(r => r[0] === p)!).filter(Boolean), ...COUNTRIES.filter(r => !priority.includes(r[0]))]
  const rows = COUNTRIES.filter(([c, n, d]) => n.toLowerCase().includes(s) || c.toLowerCase() === s || d.startsWith(s))
  const rank = ([c, n, d]: [string, string, string]) => (c.toLowerCase() === s || d === s ? 0 : n.toLowerCase().startsWith(s) ? 1 : n.toLowerCase().split(/[\s(]+/).some(w => w.startsWith(s)) ? 2 : 3)
  return rows.sort((a, b) => rank(a) - rank(b))
}

/** Checks a number typed with its country code ("+971 50 123 4567"), or a national number with `country` given. */
export function checkPhone(raw: string | null | undefined, opts: { country?: CountryCode; kind?: PhoneKind; required?: boolean } = {}): PhoneCheck {
  const { kind = 'any', required = true } = opts
  let s = String(raw ?? '').trim()
  if (!s.replace(/[\s+()-]/g, '')) return required ? { ok: false, e164: '', error: 'Enter your phone number' } : { ok: true, e164: '' }
  if (/[a-z]/i.test(s.replace(/^whatsapp:/i, '').replace(/\s*(ext\.?|x)\s*\d+$/i, ''))) return { ok: false, e164: '', error: 'A phone number can only contain digits' }
  if (s.startsWith('00')) s = '+' + s.slice(2)
  const country = s.startsWith('+') ? undefined : opts.country
  if (!s.startsWith('+') && !country) return { ok: false, e164: '', error: 'Add the country code, e.g. +971 50 123 4567' }

  const example = (c?: CountryCode) => (c ? exampleNumber(c) : '')
  const len = validatePhoneNumberLength(s, country)
  const guess = parsePhoneNumberFromString(s, country)
  const c = guess?.country || country || (s.startsWith('+') ? countryFromDigits(s) : undefined)
  const where = c ? `${countryName(c)} (+${dialCode(c)})` : 'this country'
  if (len === 'INVALID_COUNTRY') return { ok: false, e164: '', error: 'Unknown country code — check the number starts with + and the right code' }
  if (len === 'NOT_A_NUMBER') return { ok: false, e164: '', error: 'This is not a phone number' }
  if (len === 'TOO_SHORT') return { ok: false, e164: '', country: c, error: `Too short for ${where}${c ? ` — e.g. ${example(c)}` : ''}` }
  if (len === 'INVALID_LENGTH') return { ok: false, e164: '', country: c, error: `Wrong number of digits for ${where}${c ? ` — e.g. ${example(c)}` : ''}` }
  if (len === 'TOO_LONG') return { ok: false, e164: '', country: c, error: `Too long for ${where}${c ? ` — e.g. ${example(c)}` : ''}` }

  const pn = guess
  if (!pn || !pn.isValid()) return { ok: false, e164: '', country: c, error: c ? `Not a valid ${countryName(c)} number — e.g. ${example(c)}` : 'Not a valid phone number' }
  if (looksFake(pn.nationalNumber)) return { ok: false, e164: '', country: pn.country, error: 'This looks like a placeholder — please enter your real number' }
  if (kind === 'mobile') {
    const t = pn.getType()
    if (t && t !== 'MOBILE' && t !== 'FIXED_LINE_OR_MOBILE') return { ok: false, e164: '', country: pn.country, error: `Enter a mobile number (it receives SMS / WhatsApp)${pn.country ? ` — e.g. ${example(pn.country)}` : ''}` }
  }
  return { ok: true, e164: pn.number, country: pn.country, international: pn.formatInternational() }
}

/** For react-hook-form `validate`: true, or the message to show. */
export const phoneRule = (opts: { kind?: PhoneKind; required?: boolean } = {}) => (v: string) => { const r = checkPhone(v, opts); return r.ok || r.error! }
/** The stored form of a number ("+971501234567"), or the input unchanged when it is not valid. */
export const toE164Phone = (v: string) => checkPhone(v, { required: false }).e164 || v

/** The national part spaced as people write it ("50 123 4568", "7911 123456"), while it is being typed. Formatted as
 *  an international number and the code dropped — national-mode formatting leaves e.g. UAE and UK numbers unspaced
 *  unless they start with the trunk 0. A number typed with its trunk 0 ("050…") keeps the national format. */
export function formatAsTyped(country: CountryCode, digits: string): string {
  const d = digits.replace(/\D/g, '')
  if (!d) return ''
  const code = dialCode(country)
  if (d.startsWith('0') || !code) return new AsYouType(country).input(d)
  const out = new AsYouType().input(`+${code}${d}`)
  return out.startsWith(`+${code}`) ? out.slice(code.length + 1).trimStart() : d
}
