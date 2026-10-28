'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Page numbers to show: always the first and last, the current page with `siblings` either side, and "…" for gaps.
// e.g. 1 … 4 5 [6] 7 8 … 20
function pageItems(page: number, total: number, siblings: number): (number | '…')[] {
  const start = Math.max(2, page - siblings)
  const end = Math.min(total - 1, page + siblings)
  const items: (number | '…')[] = [1]
  if (start > 2) items.push(start === 3 ? 2 : '…')
  for (let p = start; p <= end; p++) items.push(p)
  if (end < total - 1) items.push(end === total - 2 ? total - 1 : '…')
  if (total > 1) items.push(total)
  return items
}

// Bottom-of-list page navigation for the Buy / Rent / New Projects lists.
// Wide screens: ‹ Prev  1 … 4 5 [6] 7 8 … 20  Next ›  ·  phones: ‹  1 … [6] … 20  ›  plus "Page 6 of 20".
// With `hrefFor` every page is a real <a href> (?page=N) — search engines can follow the list to its later pages —
// while a click still switches pages in place.
export default function Pagination({
  page, totalPages, onChange, total, perPage, itemLabel = 'results', hrefFor,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
  total?: number          // shows "Showing 41–80 of 312 …" when given
  perPage?: number
  itemLabel?: string
  hrefFor?: (page: number) => string
}) {
  if (totalPages <= 1) return null
  const go = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return
    onChange(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  // A link to page p — or a plain button without `hrefFor`, and for an arrow that has nowhere to go.
  type BtnProps = { p: number; disabled?: boolean; children: React.ReactNode; className: string; style: React.CSSProperties; 'aria-label': string; 'aria-current'?: 'page' }
  const Btn = ({ p, disabled, children, ...rest }: BtnProps) =>
    hrefFor && !disabled
      ? <a href={hrefFor(p)} onClick={e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); go(p) }} {...rest}>{children}</a>
      : <button type="button" onClick={() => go(p)} disabled={disabled} {...rest}>{children}</button>

  const numberBtn = (p: number | '…', i: number, compact: boolean) =>
    p === '…' ? (
      <span key={`gap-${i}`} aria-hidden className="w-7 text-center text-sm select-none tracking-widest" style={{ color: 'var(--text-muted)' }}>…</span>
    ) : (
      <Btn
        key={p}
        p={p}
        aria-label={`Page ${p}`}
        aria-current={p === page ? 'page' : undefined}
        className={`${compact ? 'min-w-9 h-9' : 'min-w-10 h-10'} px-2 inline-flex items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-all ${p === page ? '' : 'hover:bg-[rgba(203,1,1,0.08)] hover:text-[var(--teal)]'}`}
        style={p === page
          ? { background: 'var(--grad)', color: '#fff', boxShadow: '0 6px 16px rgba(203,1,1,0.28)' }
          : { color: 'var(--text-mid)' }}
      >
        {p}
      </Btn>
    )

  const arrow = (dir: -1 | 1, withLabel: boolean) => {
    const disabled = dir < 0 ? page <= 1 : page >= totalPages
    return (
      <Btn
        p={page + dir}
        disabled={disabled}
        aria-label={dir < 0 ? 'Previous page' : 'Next page'}
        className={`${withLabel ? 'h-10 pl-3 pr-4 gap-1' : 'h-9 w-9 justify-center'} inline-flex items-center rounded-full text-sm font-semibold transition-all disabled:opacity-35 disabled:cursor-not-allowed ${disabled ? '' : 'hover:border-[var(--teal)] hover:text-[var(--teal)]'}`}
        style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--bg)' }}
      >
        {dir < 0 && <ChevronLeft size={16} />}
        {withLabel && <span className={dir < 0 ? '' : 'pl-1'}>{dir < 0 ? 'Previous' : 'Next'}</span>}
        {dir > 0 && <ChevronRight size={16} />}
      </Btn>
    )
  }

  const from = perPage ? (page - 1) * perPage + 1 : 0
  const to = perPage && total ? Math.min(page * perPage, total) : 0

  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-col items-center gap-3">
      {/* Tablet / desktop — one rounded bar: Previous, the page numbers, Next */}
      <div className="hidden sm:flex items-center gap-1 p-1.5 rounded-full" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 24px -16px rgba(15,23,42,0.35)' }}>
        {arrow(-1, true)}
        <div className="flex items-center gap-1.5 mx-1">{pageItems(page, totalPages, 2).map((p, i) => numberBtn(p, i, false))}</div>
        {arrow(1, true)}
      </div>
      {/* Phones — fewer numbers so it never wraps */}
      <div className="flex sm:hidden items-center gap-0.5 p-1 rounded-full max-w-full" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 24px -16px rgba(15,23,42,0.35)' }}>
        {arrow(-1, false)}
        <div className="flex items-center gap-1 mx-0.5">{pageItems(page, totalPages, page > 2 && page < totalPages - 1 ? 0 : 1).map((p, i) => numberBtn(p, i, true))}</div>
        {arrow(1, false)}
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {total && perPage
          ? <>Showing <strong style={{ color: 'var(--text-mid)' }}>{from.toLocaleString()}–{to.toLocaleString()}</strong> of {total.toLocaleString()} {itemLabel} · Page {page} of {totalPages}</>
          : <>Page {page} of {totalPages}</>}
      </p>
    </nav>
  )
}
