'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Activity, Loader2, Plus, Trash2, FlaskConical } from 'lucide-react'
import { feedAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

// Admin → Feed Insights: what visitors look at, save, compare and enquire about on the personalised For Sale feed;
// where demand is; how each recommendation slot performs; and the A/B tests on the feed.

type Row = { kind: 'property' | 'project'; id: string; title: string; slug: string; area?: string; price?: number; impressions: number; clicks: number; views: number; saves: number; compares: number; enquiries: number; ctr: number; conversion: number; engagementRate: number; belowMarketPct?: number; distress?: boolean }
const pct = (n: number) => `${(n * 100).toFixed(n > 0 && n < 0.01 ? 2 : 1)}%`
const href = (r: Row) => (r.kind === 'project' ? `/projects/${r.slug}` : `/buyer/properties/${r.slug}`)
const SOURCE_LABEL: Record<string, string> = {
  rel: 'Relevant to the visitor', similar: 'Similar to viewed', fresh: 'New listing', value: 'Value / below market', popular: 'Popular in their area',
  quality: 'Complete, high-quality listing', investment: 'Investment', discovery: 'Discovery (outside their usual taste)',
  'section:recommended': 'Recommended for You', 'section:continue': 'Continue Browsing', 'section:because-area': 'Because you viewed: area',
  'section:because-beds': 'Because you viewed: bedrooms', 'section:because-price': 'Because you viewed: price', 'section:because-project': 'Because you viewed: project',
}

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`card p-5 ${className}`}>
      <p className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>{title}</p>
      {children}
    </div>
  )
}
function ItemTable({ rows, metric, label }: { rows: Row[]; metric: (r: Row) => string; label: string }) {
  if (!rows.length) return <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No data yet.</p>
  return (
    <div className="space-y-1.5">
      {rows.map(r => (
        <div key={`${r.kind}-${r.id}`} className="flex items-center gap-3 text-xs">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex-shrink-0" style={{ background: r.kind === 'project' ? 'rgba(168,85,247,0.12)' : 'rgba(37,99,235,0.10)', color: r.kind === 'project' ? '#7C3AED' : '#2563EB' }}>{r.kind === 'project' ? 'Project' : 'Listing'}</span>
          <Link href={href(r)} target="_blank" className="flex-1 min-w-0 truncate hover:underline" style={{ color: 'var(--text)' }}>{r.title}{r.area ? <span style={{ color: 'var(--text-muted)' }}> · {r.area}</span> : null}</Link>
          <span className="font-bold flex-shrink-0" style={{ color: 'var(--teal)' }} title={label}>{metric(r)}</span>
        </div>
      ))}
    </div>
  )
}
function Demand({ rows }: { rows: { key: string; label: string; demand: number; views: number; enquiries: number }[] }) {
  if (!rows.length) return <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No data yet.</p>
  const max = Math.max(...rows.map(r => r.demand), 1)
  return (
    <div className="space-y-2">
      {rows.map(r => (
        <div key={r.key} className="text-xs">
          <div className="flex justify-between mb-0.5"><span style={{ color: 'var(--text)' }} className="truncate">{r.label}</span><span style={{ color: 'var(--text-muted)' }}>{r.views} views · {r.enquiries} enquiries</span></div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-alt)' }}><div className="h-full rounded-full" style={{ width: `${(r.demand / max) * 100}%`, background: 'var(--teal)' }} /></div>
        </div>
      ))}
    </div>
  )
}

export default function FeedInsightsPage() {
  const role = useAuthStore(s => s.user?.role)
  const canEdit = role === 'admin' || role === 'super_admin'
  const [days, setDays] = useState(30)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const load = useCallback(() => {
    setLoading(true)
    feedAPI.analytics(days).then(r => setData(r.data.data)).catch(() => toast.error('Could not load feed analytics')).finally(() => setLoading(false))
  }, [days])
  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-5 p-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}><Activity size={17} style={{ color: 'var(--teal)' }} /> Feed Insights</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>How visitors use the personalised For Sale feed — anonymous browsing data, no personal details.</p>
        </div>
        <select className="select-field text-sm w-auto" value={days} onChange={e => setDays(Number(e.target.value))}>
          {[7, 30, 90].map(d => <option key={d} value={d}>Last {d} days</option>)}
        </select>
      </div>

      {loading && !data ? <Loader2 className="animate-spin" size={18} style={{ color: 'var(--teal)' }} /> : data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
            {[
              ['Visitors', data.visitors], ['Cards seen', data.totals.impressions], ['Opened', data.totals.clicks], ['Page views', data.totals.views],
              ['Saves', data.totals.saves], ['Compares', data.totals.compares], ['Enquiries & contacts', data.totals.enquiries],
            ].map(([l, v]) => (
              <div key={l as string} className="card p-4"><p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{l}</p><p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{Number(v).toLocaleString()}</p></div>
            ))}
          </div>
          {data.totals.impressions > 0 && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Click-through {pct(data.totals.clicks / data.totals.impressions)} · save rate {pct(data.totals.saves / Math.max(1, data.totals.views))} of page views · enquiry rate {pct(data.totals.enquiries / Math.max(1, data.totals.views))} of page views
            </p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <Card title="Most viewed"><ItemTable rows={data.mostViewed} metric={r => `${r.views}`} label="Page views" /></Card>
            <Card title="Most saved"><ItemTable rows={data.mostSaved} metric={r => `${r.saves}`} label="Saves" /></Card>
            <Card title="Most compared"><ItemTable rows={data.mostCompared} metric={r => `${r.compares}`} label="Compares" /></Card>
            <Card title="Most enquired (enquiry, WhatsApp, call, viewing)"><ItemTable rows={data.mostEnquired} metric={r => `${r.enquiries}`} label="Enquiries" /></Card>
            <Card title="Most clicked in the feed"><ItemTable rows={data.mostClicked} metric={r => `${r.clicks}`} label="Clicks" /></Card>
            <Card title="Highest conversion (enquiries ÷ views, 10+ views)"><ItemTable rows={data.highestConversion} metric={r => pct(r.conversion)} label="Conversion" /></Card>
            <Card title="Highest engagement (30+ impressions)"><ItemTable rows={data.highestEngagement} metric={r => r.engagementRate.toFixed(2)} label="Weighted actions per impression" /></Card>
            <Card title="Seen but never opened (30+ impressions, no clicks)"><ItemTable rows={data.impressionsNoClicks} metric={r => `${r.impressions} seen`} label="Impressions" /></Card>
            <Card title="Opened but no enquiry (10+ clicks)"><ItemTable rows={data.clicksNoEnquiries} metric={r => `${r.clicks} clicks`} label="Clicks" /></Card>
            <Card title="Distress & below-market deals with most interest"><ItemTable rows={data.distressInterest} metric={r => (r.belowMarketPct ? `${r.belowMarketPct}% below` : 'Distress')} label="Deal" /></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <Card title="Areas with highest demand"><Demand rows={data.demand.areas} /></Card>
            <Card title="Price ranges with highest demand"><Demand rows={data.demand.priceBands} /></Card>
            <Card title="Bedroom preferences"><Demand rows={data.demand.bedrooms} /></Card>
            <Card title="Developer demand"><Demand rows={data.demand.developers} /></Card>
            <Card title="Property types"><Demand rows={data.demand.types} /></Card>
            <Card title="Recommendation performance (click-through by slot)">
              {data.sources.length ? (
                <div className="space-y-1.5">
                  {data.sources.map((s: any) => (
                    <div key={s.source} className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate" style={{ color: 'var(--text)' }}>{SOURCE_LABEL[s.source] || s.source}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{s.impressions} seen · {s.clicks} opened · <b style={{ color: 'var(--teal)' }}>{pct(s.ctr)}</b></span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No data yet.</p>}
            </Card>
          </div>
        </>
      )}

      <Experiments results={data?.experiments || []} canEdit={canEdit} onChanged={load} />
    </div>
  )
}

// ── A/B tests ──
const PRESETS: Record<string, { name: string; description: string; variants: { name: string; weight: number; config: any }[] }> = {
  feed_ranking: { name: 'Ranking strategy', description: 'Personalised ranking vs. value-first vs. freshness-first.', variants: [{ name: 'personalized', weight: 50, config: { strategy: 'personalized' } }, { name: 'value_first', weight: 50, config: { strategy: 'value_first' } }] },
  feed_batch: { name: 'Cards per batch', description: 'How many cards load per scroll batch.', variants: [{ name: 'batch_24', weight: 50, config: { batchSize: 24 } }, { name: 'batch_36', weight: 50, config: { batchSize: 36 } }] },
}
function Experiments({ results, canEdit, onChanged }: { results: any[]; canEdit: boolean; onChanged: () => void }) {
  const [list, setList] = useState<any[]>([])
  const [draft, setDraft] = useState<any | null>(null)
  const [busy, setBusy] = useState(false)
  const load = useCallback(() => { feedAPI.listExperiments().then(r => setList(r.data.data || [])).catch(() => {}) }, [])
  useEffect(() => { load() }, [load])
  const save = async () => {
    setBusy(true)
    try {
      const body = { ...draft, variants: draft.variants.map((v: any) => ({ ...v, config: typeof v.config === 'string' ? v.config : JSON.stringify(v.config || {}) })) }
      if (draft._id) await feedAPI.updateExperiment(draft._id, body); else await feedAPI.createExperiment(body)
      toast.success('Saved'); setDraft(null); load(); onChanged()
    } catch (e: any) { toast.error(e?.message || e?.error || 'Could not save the test') } finally { setBusy(false) }
  }
  const toggle = async (e: any) => { await feedAPI.updateExperiment(e._id, { active: !e.active }).catch(() => toast.error('Could not update')); load(); onChanged() }
  const remove = async (e: any) => { if (!confirm(`Delete the test "${e.name || e.key}"?`)) return; await feedAPI.deleteExperiment(e._id).catch(() => {}); load(); onChanged() }
  return (
    <div className="card p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}><FlaskConical size={15} style={{ color: 'var(--teal)' }} /> A/B tests</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Each visitor always sees the same variant. Wired into the feed today: <b>feed_ranking</b> (config <code>strategy</code>: personalized · value_first · fresh_first) and <b>feed_batch</b> (config <code>batchSize</code>). Other keys are recorded and measured, ready for the page to read.</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            {Object.entries(PRESETS).filter(([k]) => !list.some(e => e.key === k)).map(([k, p]) => (
              <button key={k} type="button" className="btn-outline btn-sm gap-1.5" onClick={() => setDraft({ key: k, ...p, active: false })}><Plus size={12} /> {p.name}</button>
            ))}
            <button type="button" className="btn-outline btn-sm gap-1.5" onClick={() => setDraft({ key: '', name: '', description: '', active: false, variants: [{ name: 'control', weight: 50, config: {} }, { name: 'variant_b', weight: 50, config: {} }] })}><Plus size={12} /> Custom</button>
          </div>
        )}
      </div>

      {list.length === 0 && !draft && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No tests yet.</p>}
      {list.map(e => {
        const r = results.find(x => x.key === e.key)
        return (
          <div key={e._id} className="rounded-xl p-3" style={{ border: '1px solid var(--border)' }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{e.name || e.key} <span className="text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>· {e.key}</span>
                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: e.active ? 'rgba(16,185,129,0.12)' : 'var(--bg-alt)', color: e.active ? '#047857' : 'var(--text-muted)' }}>{e.active ? 'Running' : 'Paused'}</span></p>
              {canEdit && (
                <div className="flex gap-2">
                  <button type="button" className="btn-outline btn-sm" onClick={() => toggle(e)}>{e.active ? 'Pause' : 'Start'}</button>
                  <button type="button" className="btn-outline btn-sm" onClick={() => setDraft({ ...e, variants: e.variants.map((v: any) => ({ ...v, config: JSON.stringify(v.config || {}) })) })}>Edit</button>
                  <button type="button" className="btn-ghost btn-sm p-1.5" onClick={() => remove(e)} aria-label="Delete"><Trash2 size={13} style={{ color: '#FB7185' }} /></button>
                </div>
              )}
            </div>
            {r?.variants?.length ? (
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-xs" style={{ color: 'var(--text-mid)' }}>
                  <thead><tr style={{ color: 'var(--text-muted)' }}>{['Variant', 'Visitors', 'Impressions', 'CTR', 'Views', 'Saves', 'Compares', 'Enquiries', 'WhatsApp', 'Viewings'].map(h => <th key={h} className="text-left font-semibold py-1 pr-3">{h}</th>)}</tr></thead>
                  <tbody>{r.variants.map((v: any) => (
                    <tr key={v.variant} style={{ borderTop: '1px solid var(--border-soft)' }}>
                      <td className="py-1 pr-3 font-semibold" style={{ color: 'var(--text)' }}>{v.variant}</td><td className="pr-3">{v.visitors}</td><td className="pr-3">{v.impressions}</td>
                      <td className="pr-3">{pct(v.ctr)}</td><td className="pr-3">{pct(v.viewRate)}</td><td className="pr-3">{pct(v.saveRate)}</td><td className="pr-3">{pct(v.compareRate)}</td>
                      <td className="pr-3">{pct(v.enquiryRate)}</td><td className="pr-3">{pct(v.whatsappRate)}</td><td className="pr-3">{pct(v.viewingRate)}</td>
                    </tr>))}</tbody>
                </table>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Rates are per card impression. Wait for a few hundred visitors per variant before deciding.</p>
              </div>
            ) : <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>No results yet.</p>}
          </div>
        )
      })}

      {draft && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="input" placeholder="key, e.g. feed_ranking" value={draft.key} disabled={!!draft._id} onChange={e => setDraft({ ...draft, key: e.target.value })} />
            <input className="input" placeholder="Name" value={draft.name || ''} onChange={e => setDraft({ ...draft, name: e.target.value })} />
            <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text)' }}><input type="checkbox" checked={!!draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })} /> Running</label>
          </div>
          <input className="input w-full" placeholder="What is being tested" value={draft.description || ''} onChange={e => setDraft({ ...draft, description: e.target.value })} />
          {draft.variants.map((v: any, i: number) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <input className="input col-span-3" placeholder="Variant name" value={v.name} onChange={e => setDraft({ ...draft, variants: draft.variants.map((x: any, j: number) => j === i ? { ...x, name: e.target.value } : x) })} />
              <input className="input col-span-2" type="number" placeholder="Weight" value={v.weight} onChange={e => setDraft({ ...draft, variants: draft.variants.map((x: any, j: number) => j === i ? { ...x, weight: Number(e.target.value) } : x) })} />
              <input className="input col-span-6 font-mono text-xs" placeholder='Settings (JSON), e.g. {"strategy":"value_first"}' value={typeof v.config === 'string' ? v.config : JSON.stringify(v.config || {})} onChange={e => setDraft({ ...draft, variants: draft.variants.map((x: any, j: number) => j === i ? { ...x, config: e.target.value } : x) })} />
              <button type="button" className="btn-ghost btn-sm col-span-1" disabled={draft.variants.length <= 2} onClick={() => setDraft({ ...draft, variants: draft.variants.filter((_: any, j: number) => j !== i) })}><Trash2 size={13} /></button>
            </div>
          ))}
          <div className="flex gap-2">
            <button type="button" className="btn-outline btn-sm" onClick={() => setDraft({ ...draft, variants: [...draft.variants, { name: '', weight: 0, config: '{}' }] })}>Add variant</button>
            <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save test'}</button>
            <button type="button" className="btn-ghost btn-sm" onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
