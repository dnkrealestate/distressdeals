'use client'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2, RefreshCw, ListChecks, CheckCircle2, Database, UploadCloud } from 'lucide-react'
import { marketReferenceAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import type { MarketReference, ProjectDld } from '@/types'

// Admin only — the market reference of one listing / project: the automatic figure worked out from registered sales,
// our own verified figure, which of the two is in use, and the sales the automatic one rests on. Everything automatic
// is read-only; the verified figure is still typed into the form's own "market value / comparable market price" field.

const SOURCE: Record<string, string> = { ADMIN: 'Admin verified', DLD: 'DLD', DUBAI_PULSE: 'Dubai open data (DLD)', LICENSED_PROVIDER: 'Licensed provider', HYBRID: 'Several sources', LISTINGS: 'Comparable listings on our site' }
const CONFIDENCE_COLOR: Record<string, string> = { HIGH: '#047857', MEDIUM: '#0369A1', LOW: '#B45309', INSUFFICIENT: '#B45309', VERIFIED: '#047857' }
const day = (d?: string | Date | null) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const dayTime = (d?: string | Date | null) => (d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')
const full = (n?: number | null) => (n ? `AED ${Math.round(n).toLocaleString('en-US')}` : '—')

interface StaffView {
  adminReferencePrice: number | null
  automaticReference: MarketReference | null
  activeReference: 'admin' | 'automatic' | null
  marketReference: MarketReference | null
  checkedAt: string | null
  opportunity: { score: number; belowMarketPct?: number; advantage?: number } | null
  dld?: ProjectDld | null
}
const DLD_STATUS: Record<string, string> = { not_started: 'Not started', active: 'Under construction', pending: 'On hold', finished: 'Completed', cancelled: 'Cancelled' }
interface Comparable { date: string; building?: string; project?: string; community?: string; type: string; bedrooms?: number | null; sizeSqft: number; price: number; pricePerSqft: number; status?: string }

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
      {label}<br /><b className="text-xs" style={{ color: 'var(--text)' }}>{children}</b>
    </p>
  )
}

export default function MarketReferencePanel({ kind, id, isAdmin = false }: { kind: 'property' | 'project'; id: string; isAdmin?: boolean }) {
  const [data, setData] = useState<StaffView | null>(null)
  const [busy, setBusy] = useState<'' | 'load' | 'recalc' | 'mode' | 'comps'>('load')
  const [comps, setComps] = useState<Comparable[] | null>(null)
  const [showData, setShowData] = useState(false)

  useEffect(() => {
    let alive = true
    marketReferenceAPI.manage(kind, id).then(r => { if (alive) setData(r.data.data) }).catch(() => {}).finally(() => { if (alive) setBusy('') })
    return () => { alive = false }
  }, [kind, id])

  const act = async (what: 'recalc' | 'mode', run: () => Promise<any>, done: string) => {
    setBusy(what)
    try { const r = await run(); setData(r.data.data); setComps(null); toast.success(done) }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not update the market reference') }
    finally { setBusy('') }
  }
  const viewComparables = async () => {
    if (comps) { setComps(null); return }
    setBusy('comps')
    try { setComps((await marketReferenceAPI.comparables(kind, id)).data.data.comparables || []) }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not load the comparables') }
    finally { setBusy('') }
  }

  const auto = data?.automaticReference, active = data?.marketReference
  const usingAdmin = active?.sourceType === 'ADMIN'
  const btn = 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-50'
  const btnStyle = { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>Market Reference <span className="font-normal" style={{ color: 'var(--text-muted)' }}>· admin only</span></p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Worked out automatically from registered sales of like-for-like homes. Read-only — it never replaces a figure you entered.</p>
        </div>
        {busy === 'load' && <Loader2 size={14} className="animate-spin flex-shrink-0" style={{ color: 'var(--teal)' }} />}
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2.5">
            <Row label="Automatic reference">{auto ? full(auto.price) : 'Not available'}{auto?.unit ? ` (${auto.unit})` : ''}</Row>
            <Row label="Automatic AED / sq ft">{auto?.pricePerSqft ? full(auto.pricePerSqft) : '—'}</Row>
            <Row label="Comparable transactions">{auto?.comparableCount ?? 0}</Row>
            <Row label="Market confidence"><span style={{ color: CONFIDENCE_COLOR[auto?.confidence || ''] || 'var(--text)' }}>{auto?.confidence || '—'}</span></Row>
            <Row label="Market data">{auto ? SOURCE[auto.sourceType] || auto.sourceType : '—'}</Row>
            <Row label="Last updated">{dayTime(auto?.calculatedAt || data.checkedAt)}</Row>
            <Row label="Admin reference">{data.adminReferencePrice ? full(data.adminReferencePrice) : 'Not set'}</Row>
            <Row label="Market reference source">{active ? (usingAdmin ? 'Admin verified' : active.sourceType === 'LISTINGS' ? SOURCE.LISTINGS : 'Automatic') : 'None — no claim shown'}</Row>
          </div>

          {kind === 'project' && <DldLink id={id} dld={data.dld || null} onChange={setData} />}

          {auto?.notes && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{auto.notes}{auto.periodStart ? ` Sales from ${day(auto.periodStart)} to ${day(auto.periodEnd)}.` : ''}</p>}
          {auto && !auto.publicEligible && <p className="text-[11px]" style={{ color: '#B45309' }}>Fewer than 5 comparable sales — this figure is shown here for information only and is never used for a public "below market" claim.</p>}
          {auto?.publicEligible && !usingAdmin && active?.sourceType !== 'LISTINGS' && !data.opportunity?.belowMarketPct && (
            <p className="text-[11px]" style={{ color: '#B45309' }}>No public claim: the price is not 5%–25% below the automatic reference. Outside that range an automatic figure is not shown unless you verify a reference price yourself.</p>
          )}
          {data.opportunity?.belowMarketPct ? (
            <p className="text-[11px] font-medium" style={{ color: '#047857' }}>In use now: {full(active?.price)} → {data.opportunity.belowMarketPct}% below market · potential advantage {formatPrice(data.opportunity.advantage || 0)} · Opportunity Score {data.opportunity.score}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn} style={btnStyle} disabled={!!busy || !auto} onClick={viewComparables}>
              {busy === 'comps' ? <Loader2 size={12} className="animate-spin" /> : <ListChecks size={12} />} {comps ? 'Hide comparables' : 'View comparables'}
            </button>
            <button type="button" className={btn} style={btnStyle} disabled={!!busy} onClick={() => act('recalc', () => marketReferenceAPI.recalculate(kind, id), 'Market reference recalculated')}>
              {busy === 'recalc' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Recalculate
            </button>
            {data.adminReferencePrice && auto?.publicEligible && (
              usingAdmin
                ? <button type="button" className={btn} style={btnStyle} disabled={!!busy} onClick={() => act('mode', () => marketReferenceAPI.setActive(kind, id, 'automatic'), 'Using the automatic reference')}><CheckCircle2 size={12} /> Use automatic reference</button>
                : <button type="button" className={btn} style={btnStyle} disabled={!!busy} onClick={() => act('mode', () => marketReferenceAPI.setActive(kind, id, 'admin'), 'Using the admin reference')}><CheckCircle2 size={12} /> Use admin reference</button>
            )}
            {isAdmin && (
              <button type="button" className={btn} style={btnStyle} onClick={() => setShowData(v => !v)}><Database size={12} /> Market data</button>
            )}
          </div>

          {comps && (
            <div className="rounded-lg overflow-auto max-h-72" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              {comps.length === 0 ? <p className="text-[11px] p-3" style={{ color: 'var(--text-muted)' }}>No comparable sales found.</p> : (
                <table className="w-full text-[11px]" style={{ color: 'var(--text-mid)' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)' }}>
                      {['Date', 'Building / project', 'Community', 'Beds', 'Size (sq ft)', 'Price', 'AED / sq ft'].map(h => <th key={h} className="text-left font-semibold px-2.5 py-2 whitespace-nowrap">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {comps.map((c, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                        <td className="px-2.5 py-1.5 whitespace-nowrap">{day(c.date)}</td>
                        <td className="px-2.5 py-1.5">{c.building || c.project || '—'}</td>
                        <td className="px-2.5 py-1.5">{c.community || '—'}</td>
                        <td className="px-2.5 py-1.5">{c.bedrooms == null ? '—' : c.bedrooms === 0 ? 'Studio' : c.bedrooms}</td>
                        <td className="px-2.5 py-1.5">{c.sizeSqft.toLocaleString('en-US')}</td>
                        <td className="px-2.5 py-1.5 whitespace-nowrap">{full(c.price)}</td>
                        <td className="px-2.5 py-1.5">{c.pricePerSqft.toLocaleString('en-US')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {showData && isAdmin && <MarketDataStatus onChanged={() => marketReferenceAPI.manage(kind, id).then(r => setData(r.data.data)).catch(() => {})} />}
        </>
      )}
    </div>
  )
}

// Which development in the land department's register this project is — found automatically by exact name, or picked
// here. Its official status and % completed are what the website shows as "Construction Progress".
function DldLink({ id, dld, onChange }: { id: string; dld: ProjectDld | null; onChange: (d: StaffView) => void }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<any[] | null>(null)
  const [busy, setBusy] = useState(false)
  const search = async () => {
    if (q.trim().length < 2) return
    setBusy(true)
    try { setRows((await marketReferenceAPI.searchDldProjects(q.trim())).data.data || []) } catch { toast.error('Could not search the DLD register') } finally { setBusy(false) }
  }
  const link = async (dldProjectId: string | null) => {
    setBusy(true)
    try { onChange((await marketReferenceAPI.setDldLink(id, dldProjectId)).data.data); setOpen(false); setRows(null); toast.success(dldProjectId ? 'Linked to the DLD project' : 'Link removed') }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not update the link') } finally { setBusy(false) }
  }
  const btn = 'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold disabled:opacity-50'
  const btnStyle = { background: 'var(--bg-alt)', border: '1px solid var(--border)', color: 'var(--text)' }
  return (
    <div className="rounded-lg p-3 space-y-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          DLD project record<br />
          {dld ? (
            <b className="text-xs" style={{ color: 'var(--text)' }}>
              {dld.name}{dld.projectNumber || dld.projectId ? ` (#${dld.projectNumber || dld.projectId})` : ''} · {DLD_STATUS[dld.status || ''] || dld.statusText || 'status unknown'}
              {typeof dld.percentCompleted === 'number' ? ` · ${dld.percentCompleted}% completed` : ''}{dld.endDate ? ` · completion ${day(dld.endDate)}` : ''}
              <span className="font-normal" style={{ color: 'var(--text-muted)' }}> · {dld.matchedBy === 'admin' ? 'linked by admin' : 'matched automatically'} · updated {day(dld.syncedAt)}</span>
            </b>
          ) : <b className="text-xs" style={{ color: 'var(--text)' }}>Not linked — no construction progress is shown on the website</b>}
        </p>
        <div className="flex gap-2">
          <button type="button" className={btn} style={btnStyle} disabled={busy} onClick={() => setOpen(v => !v)}>{dld ? 'Change' : 'Link a DLD project'}</button>
          {dld && <button type="button" className={btn} style={btnStyle} disabled={busy} onClick={() => link(null)}>{dld.matchedBy === 'admin' ? 'Back to automatic' : 'Re-match'}</button>}
        </div>
      </div>
      {open && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input className="input text-xs flex-1" placeholder="DLD project name or number" value={q} onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); search() } }} />
            <button type="button" className={btn} style={btnStyle} disabled={busy} onClick={search}>{busy ? <Loader2 size={12} className="animate-spin" /> : null} Search</button>
          </div>
          {rows && (rows.length === 0
            ? <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Nothing found in the stored DLD register. It is filled by the DLD sync (Market data → Sync now).</p>
            : rows.map(r => (
              <div key={r.projectId} className="flex items-center justify-between gap-3 text-[11px] py-1" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-mid)' }}>
                <span><b style={{ color: 'var(--text)' }}>{r.name}</b> (#{r.projectNumber || r.projectId}){r.developerName ? ` · ${r.developerName}` : ''}{r.masterProject || r.area ? ` · ${r.masterProject || r.area}` : ''}
                  {' · '}{DLD_STATUS[r.status || ''] || r.statusText || '—'}{typeof r.percentCompleted === 'number' ? ` · ${r.percentCompleted}%` : ''}</span>
                <button type="button" className={btn} style={btnStyle} disabled={busy} onClick={() => link(r.projectId)}>Link</button>
              </div>
            )))}
        </div>
      )}
    </div>
  )
}

// The state of the market-data store as a whole, with the two admin actions: fetch from the configured source, or
// import a DLD transactions file downloaded by our team (checked first, saved only when confirmed).
function MarketDataStatus({ onChanged }: { onChanged: () => void }) {
  const [s, setS] = useState<any>(null)
  const [busy, setBusy] = useState('')
  const [preview, setPreview] = useState<{ file: File; result: any } | null>(null)
  const [tested, setTested] = useState<any>(null)
  const test = async () => {
    setBusy('test')
    try { setTested((await marketReferenceAPI.test()).data.data) } catch (e: any) { setTested({ ok: false, message: e?.response?.data?.message || 'The connection test could not run' }) } finally { setBusy('') }
  }
  const input = useRef<HTMLInputElement>(null)
  const load = () => marketReferenceAPI.status().then(r => setS(r.data.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const run = async (what: string, call: () => Promise<any>, ok: (d: any) => string) => {
    setBusy(what)
    try { const r = await call(); toast.success(ok(r.data.data)); setPreview(null); await load(); onChanged() }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Market data could not be updated — existing references are kept') }
    finally { setBusy('') }
  }
  const check = async (file?: File) => {
    if (!file) return
    setBusy('check')
    try { setPreview({ file, result: (await marketReferenceAPI.importFile(file, true)).data.data }) }
    catch (e: any) { toast.error(e?.response?.data?.message || 'That file could not be read as DLD transactions') }
    finally { setBusy(''); if (input.current) input.current.value = '' }
  }
  const btn = 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-50'
  const btnStyle = { background: 'var(--bg-alt)', border: '1px solid var(--border)', color: 'var(--text)' }
  const last = s?.lastRuns?.[0]

  return (
    <div className="rounded-lg p-3 space-y-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {!s ? <Loader2 size={13} className="animate-spin" style={{ color: 'var(--teal)' }} /> : (
        <>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <b style={{ color: 'var(--text)' }}>{Number(s.transactions || 0).toLocaleString('en-US')}</b> registered sales stored
            {s.newestTransaction ? <> · {day(s.oldestTransaction)} to {day(s.newestTransaction)}</> : null}
            {' · '}<b style={{ color: 'var(--text)' }}>{Number(s.registerProjects || 0).toLocaleString('en-US')}</b> DLD projects in the register ({s.linkedProjects || 0} of our {s.ourProjects || 0} projects linked)
            {' · '}source: {s.live ? 'DLD live API' : 'DLD file'}{s.configured ? '' : ' (not configured)'}
            {' · '}automatic sync {s.enabled ? (s.configured ? `on (${s.schedule})` : 'on, but no source is configured') : 'off'}
            {last ? <> · last run {dayTime(last.finishedAt || last.startedAt)}: {last.ok ? `${last.imported} new, ${last.updated} updated` : `failed — ${last.error || 'unknown error'}`}</> : null}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn} style={btnStyle} disabled={!!busy || !s.configured} title={s.configured ? '' : 'No market-data source is configured on the server'}
              onClick={() => run('sync', () => marketReferenceAPI.sync(), d => `Sync finished: ${d.imported} new sales, ${d.updated} updated${d.projectsLinked != null ? ` · ${d.projectsLinked} projects linked to DLD` : ''}`)}>
              {busy === 'sync' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Sync now
            </button>
            {s.canTest && (
              <button type="button" className={btn} style={btnStyle} disabled={!!busy} onClick={test}>
                {busy === 'test' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Test DLD connection
              </button>
            )}
            <button type="button" className={btn} style={btnStyle} disabled={!!busy} onClick={() => input.current?.click()}>
              {busy === 'check' ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />} Import DLD transactions file (.csv)
            </button>
            <button type="button" className={btn} style={btnStyle} disabled={!!busy || !s.transactions}
              onClick={() => run('all', () => marketReferenceAPI.recalculateAll(), d => `${d.updated} references updated, ${d.cleared} without comparables`)}>
              {busy === 'all' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Recalculate all
            </button>
            <input ref={input} type="file" accept=".csv" className="hidden" onChange={e => check(e.target.files?.[0])} />
          </div>
          {tested && (
            <p className="text-[11px]" style={{ color: tested.ok ? '#047857' : '#B45309' }}>
              {tested.message}
              {(tested.datasets || []).map((d: any) => ` · ${d.name}: ${d.ok ? `OK (${(d.columns || []).length} fields)` : d.error}`).join('')}
            </p>
          )}
          {preview && (
            <div className="text-[11px] space-y-1.5" style={{ color: 'var(--text-muted)' }}>
              <p>
                <b style={{ color: 'var(--text)' }}>{preview.file.name}</b>: {Number(preview.result.imported || 0).toLocaleString('en-US')} usable sales, {Number(preview.result.skipped || 0).toLocaleString('en-US')} rows left out
                {preview.result.skipReasons && Object.keys(preview.result.skipReasons).length ? ` (${Object.entries(preview.result.skipReasons).map(([k, v]) => `${k}: ${v}`).join(' · ')})` : ''}. Nothing has been saved yet.
              </p>
              <button type="button" className={btn} style={{ ...btnStyle, color: '#047857' }} disabled={!!busy || !preview.result.imported}
                onClick={() => run('import', () => marketReferenceAPI.importFile(preview.file, false), d => `Imported ${d.imported} new sales, ${d.updated} updated`)}>
                {busy === 'import' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Save these sales
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
