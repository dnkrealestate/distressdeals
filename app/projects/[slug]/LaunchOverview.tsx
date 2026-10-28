'use client'

import { useState } from 'react'
import { Sparkles, Home, CalendarClock, Wallet, Activity, MapPin, Building2, BellRing, FileText, UserCheck, BadgeCheck, Check } from 'lucide-react'
import type { Project } from '@/types'

// The top of a launch's page — a project announced before its units and prices. Instead of a price card:
// what the developer has announced so far ("To be announced" for the rest — nothing is guessed), a short form to say
// which units and budget the visitor wants (it goes into their enquiry, so the right price list is sent), and
// what registering gets them. Only statements about our own service — no promised discounts or allocations.

const BUDGETS = ['Under AED 1M', 'AED 1M – 2M', 'AED 2M – 3M', 'AED 3M – 5M', 'AED 5M+']
const PURPOSES = ['To live in', 'To invest']
const unitOptions = (type?: string) =>
  /villa|townhouse/i.test(type || '') ? ['3 BR', '4 BR', '5 BR+'] : ['Studio', '1 BR', '2 BR', '3 BR', '4 BR+']

function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors inline-flex items-center gap-1"
      style={on ? { background: 'var(--teal)', color: '#fff', border: '1px solid var(--teal)' } : { color: 'var(--text-mid)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
      {on && <Check size={11} />}{children}
    </button>
  )
}

export default function LaunchOverview({ project, onRegister }: { project: Project; onRegister: (message: string) => void }) {
  const [units, setUnits] = useState<string[]>([])
  const [budget, setBudget] = useState('')
  const [purpose, setPurpose] = useState('')
  const toggleUnit = (u: string) => setUnits(xs => xs.includes(u) ? xs.filter(x => x !== u) : [...xs, u])

  const handover = [project.handoverQuarter, project.handoverYear].filter(Boolean).join(' ')
  const place = [project.community, project.area, project.emirate].filter((v, i, a) => v && a.indexOf(v) === i).join(', ')
  const facts = [
    { icon: Building2, label: 'Developer', value: project.developer },
    { icon: MapPin, label: 'Location', value: place },
    { icon: Home, label: 'Property type', value: project.type ? project.type.replace(/_/g, ' ') : '' },
    { icon: Activity, label: 'Status', value: project.status ? project.status.replace(/_/g, ' ') : '' },
    { icon: CalendarClock, label: 'Handover', value: handover },
    { icon: Wallet, label: 'Payment plan', value: project.paymentPlan || '' },
  ]

  const register = () => {
    const parts = [
      `I'd like the launch prices and floor plans for ${project.title}.`,
      units.length ? `Unit types: ${units.join(', ')}.` : '',
      budget ? `Budget: ${budget}.` : '',
      purpose ? `Buying ${purpose.toLowerCase()}.` : '',
    ]
    onRegister(parts.filter(Boolean).join(' '))
  }

  return (
    <div className="space-y-5 mb-5">
      {/* Launch summary */}
      <div className="card p-5 md:p-6" style={{ borderColor: 'rgba(245,158,11,0.35)', background: 'linear-gradient(135deg, rgba(245,158,11,0.10), rgba(203,1,1,0.04) 55%, var(--surface))' }}>
        <p className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#B45309' }}>
          <Sparkles size={13} /> New launch by {project.developer}
        </p>
        <h2 className="text-xl md:text-2xl font-bold mt-1 leading-tight" style={{ color: 'var(--text)' }}>Prices &amp; floor plans on release</h2>
        <p className="text-sm mt-1.5 max-w-2xl" style={{ color: 'var(--text-mid)' }}>
          The developer has announced {project.title} but has not released unit types and prices yet. Register your interest and
          we send you the price list and floor plans as soon as they are out.
        </p>

        <p className="text-[11px] font-semibold uppercase tracking-wider mt-5 mb-2" style={{ color: 'var(--text-muted)' }}>Announced so far</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl px-3 py-2.5 min-w-0" style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}>
              <p className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}><Icon size={12} style={{ color: 'var(--teal)' }} /> {label}</p>
              <p className={`text-sm font-semibold mt-0.5 truncate${value ? ' capitalize' : ''}`} style={{ color: value ? 'var(--text)' : 'var(--text-muted)' }} title={value || undefined}>
                {value || 'To be announced'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Lead block: what they want → into the enquiry */}
      <div className="card p-5 md:p-6">
        <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Get the launch details first</h3>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Tell us what you are looking for — we send the matching units and prices when they are released.</p>

        <div className="mt-4 space-y-3.5">
          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Unit types <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(pick any)</span></p>
            <div className="flex flex-wrap gap-1.5">{unitOptions(project.type).map(u => <Chip key={u} on={units.includes(u)} onClick={() => toggleUnit(u)}>{u}</Chip>)}</div>
          </div>
          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Budget</p>
            <div className="flex flex-wrap gap-1.5">{BUDGETS.map(b => <Chip key={b} on={budget === b} onClick={() => setBudget(v => v === b ? '' : b)}>{b}</Chip>)}</div>
          </div>
          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Buying</p>
            <div className="flex flex-wrap gap-1.5">{PURPOSES.map(p => <Chip key={p} on={purpose === p} onClick={() => setPurpose(v => v === p ? '' : p)}>{p}</Chip>)}</div>
          </div>
        </div>

        <button type="button" onClick={register} className="btn-primary w-full sm:w-auto mt-5 px-6 py-3 gap-2">
          <BellRing size={16} /> Register interest — it&apos;s free
        </button>

        <div className="grid sm:grid-cols-3 gap-3 mt-6 pt-5" style={{ borderTop: '1px solid var(--border-soft)' }}>
          {[
            { icon: FileText, t: 'Price list & floor plans', d: 'Sent to you as soon as the developer releases them.' },
            { icon: UserCheck, t: 'Personal assistance', d: 'We answer your questions and help you choose and book a unit.' },
            { icon: BadgeCheck, t: 'No obligation', d: 'Registering is free — decide once you have seen the prices.' },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex gap-2.5">
              <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.08)' }}><Icon size={15} style={{ color: 'var(--teal)' }} /></span>
              <span>
                <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>{t}</span>
                <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{d}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* What happens next */}
      <div className="card p-5 md:p-6">
        <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>What happens next</h3>
        <ol className="space-y-4">
          {[
            { t: 'Register your interest', d: 'Takes a minute — tell us the unit types and budget you want.' },
            { t: 'Prices and floor plans are released', d: `When ${project.developer} releases them, we send you the units that match.` },
            { t: 'Choose and book your unit', d: 'We walk you through the payment plan and the booking steps.' },
          ].map((s, i) => (
            <li key={s.t} className="flex gap-3">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white" style={{ background: 'var(--grad)' }}>{i + 1}</span>
              <span>
                <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>{s.t}</span>
                <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.d}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
