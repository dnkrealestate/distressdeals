'use client'
import { Sparkles, Loader2, Check, X, Wand2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Tone = 'professional' | 'luxury' | 'investor' | 'family'
export type Length = 'short' | 'standard' | 'detailed'
export interface WriterInput { label: string; ok: boolean; step: number }

const TONES: { v: Tone; l: string }[] = [
  { v: 'professional', l: 'Professional' }, { v: 'luxury', l: 'Luxury' },
  { v: 'investor', l: 'Investor' }, { v: 'family', l: 'Family' },
]
const LENGTHS: { v: Length; l: string; hint: string }[] = [
  { v: 'short', l: 'Short', hint: '~250 words' },
  { v: 'standard', l: 'Standard', hint: '~450 words' },
  { v: 'detailed', l: 'Detailed', hint: '~750 words' },
]

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { v: T; l: string; hint?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button
          key={o.v} type="button" onClick={() => onChange(o.v)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: value === o.v ? 'rgba(203,1,1,0.10)' : 'var(--bg-alt)',
            border: `1px solid ${value === o.v ? 'var(--teal)' : 'var(--border)'}`,
            color: value === o.v ? 'var(--teal)' : 'var(--text-mid)',
          }}
        >
          {o.l}{o.hint && <span className="ml-1 opacity-60">{o.hint}</span>}
        </button>
      ))}
    </div>
  )
}

// The "write it for me" panel shared by the project and property forms. Shows which form facts the AI will draw
// on (tap a missing one to jump to its step), plus focus keyword, tone and length.
export default function AiWriterCard({
  subtitle, inputs, onJump, focusKeyword, onFocusKeywordChange, keywordPlaceholder,
  tone, onTone, length, onLength, generating, hasContent, onGenerate, extraOptions,
}: {
  subtitle: string
  inputs: WriterInput[]
  onJump: (step: number) => void
  focusKeyword: string
  onFocusKeywordChange: (v: string) => void
  keywordPlaceholder: string
  tone: Tone; onTone: (t: Tone) => void
  length: Length; onLength: (l: Length) => void
  generating: boolean
  hasContent: boolean
  onGenerate: () => void
  extraOptions?: React.ReactNode
}) {
  const missing = inputs.filter(i => !i.ok)
  return (
    <div className="card p-6" style={{ borderColor: 'rgba(203,1,1,0.25)' }}>
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--grad)' }}>
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>AI Writer</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        </div>
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>What the AI will use</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {inputs.map(i => (
          <button
            key={i.label} type="button" onClick={() => !i.ok && onJump(i.step)}
            title={i.ok ? undefined : `Missing — go to step ${i.step}`}
            className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium', !i.ok && 'cursor-pointer hover:opacity-80')}
            style={i.ok
              ? { background: 'rgba(22,163,74,0.10)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.25)' }
              : { background: 'var(--bg-alt)', color: 'var(--text-muted)', border: '1px dashed var(--border)' }}
          >
            {i.ok ? <Check size={11} /> : <X size={11} />} {i.label}
          </button>
        ))}
      </div>
      {missing.length > 0 && (
        <p className="text-[11px] mb-4" style={{ color: 'var(--text-muted)' }}>
          Tap a missing item to fill it in. More detail gives a more specific description that ranks better.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="md:col-span-2">
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>
            Focus keyword <span style={{ color: 'var(--text-muted)' }}>(what buyers would type into Google; leave blank to let the AI choose)</span>
          </label>
          <input className="input" value={focusKeyword} placeholder={keywordPlaceholder} onChange={e => onFocusKeywordChange(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Tone</label>
          <Segmented value={tone} options={TONES} onChange={onTone} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Length</label>
          <Segmented value={length} options={LENGTHS} onChange={onLength} />
        </div>
        {extraOptions && <div className="md:col-span-2">{extraOptions}</div>}
      </div>

      <div className="flex items-center gap-3 mt-5 flex-wrap">
        <button type="button" onClick={onGenerate} disabled={generating} className="btn-primary gap-2">
          {generating ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
          {generating ? 'Writing…' : hasContent ? 'Regenerate with AI' : 'Generate with AI'}
        </button>
        <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <AlertCircle size={11} /> Always read the draft before saving. You can edit every line below.
        </span>
      </div>
    </div>
  )
}
