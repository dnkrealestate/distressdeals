import { Globe2 } from 'lucide-react'

interface StatDef { label: string; value: number; icon: any }
interface CountryStat { country: string; count: number }

function StatTile({ label, value, icon: Icon }: StatDef) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(49,178,222,0.06)', border: '1px solid rgba(49,178,222,0.15)' }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={13} style={{ color: 'var(--teal)', flexShrink: 0 }} />
        <p className="text-[10px] uppercase tracking-wide truncate" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
      <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>{value.toLocaleString()}</p>
    </div>
  )
}

function CountryBar({ country, count, max }: CountryStat & { max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span style={{ color: 'var(--text-mid)' }}>{country}</span>
        <span className="font-semibold" style={{ color: 'var(--text)' }}>{count.toLocaleString()}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--grad)' }} />
      </div>
    </div>
  )
}

// Shared performance panel — used on both the admin property detail page and
// the admin project detail page, so a listing's and a project's engagement
// numbers always look and read the same way.
export function PerformanceStats({
  stats, conversionRate, topCountries, loading,
}: {
  stats: StatDef[]
  conversionRate?: number
  topCountries?: CountryStat[]
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array(6).fill(null).map((_, i) => <div key={i} className="shimmer h-16 rounded-xl" />)}
      </div>
    )
  }

  const maxCountry = Math.max(1, ...(topCountries || []).map(c => c.count))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map(s => <StatTile key={s.label} {...s} />)}
      </div>

      {conversionRate !== undefined && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Conversion rate (leads ÷ views): <span className="font-bold" style={{ color: 'var(--teal)' }}>{conversionRate}%</span>
        </p>
      )}

      {topCountries && topCountries.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Globe2 size={13} style={{ color: 'var(--teal)' }} />
            <p className="text-xs font-semibold" style={{ color: 'var(--text-mid)' }}>Top Visitor Countries</p>
          </div>
          <div className="space-y-2.5">
            {topCountries.map(c => <CountryBar key={c.country} {...c} max={maxCountry} />)}
          </div>
        </div>
      )}

      {(!topCountries || topCountries.length === 0) && !loading && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No visitor country data yet.</p>
      )}
    </div>
  )
}
