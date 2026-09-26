import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Page navigation made of real links (…?page=3) — for server-rendered guide pages (developer, community, area), so
// every page of results is crawlable and shareable. Looks the same as the client-side <Pagination>.
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

export default function LinkPagination({
  page, totalPages, basePath, param = 'page', total, perPage, itemLabel = 'results', anchor,
}: {
  page: number
  totalPages: number
  basePath: string          // e.g. /developers/emaar-properties
  param?: string            // query key — lets one page have two independent lists
  total?: number
  perPage?: number
  itemLabel?: string
  anchor?: string           // jump back to the list, not the top of the page
}) {
  if (totalPages <= 1) return null
  const href = (p: number) => `${basePath}${p > 1 ? `?${param}=${p}` : ''}${anchor ? `#${anchor}` : ''}`

  const numberLink = (p: number | '…', i: number, compact: boolean) =>
    p === '…' ? (
      <span key={`gap-${i}`} className="w-8 text-center text-sm select-none" style={{ color: 'var(--text-muted)' }}>…</span>
    ) : (
      <Link key={p} href={href(p)} scroll={!anchor} aria-label={`Page ${p}`} aria-current={p === page ? 'page' : undefined}
        className={`${compact ? 'min-w-9 h-9' : 'min-w-10 h-10'} px-2 rounded-xl text-sm font-semibold transition-all inline-flex items-center justify-center`}
        style={p === page
          ? { background: 'var(--grad)', color: '#fff', boxShadow: '0 6px 16px rgba(203,1,1,0.28)' }
          : { color: 'var(--text-mid)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
        {p}
      </Link>
    )

  const arrow = (dir: -1 | 1, withLabel: boolean) => {
    const target = page + dir
    const disabled = target < 1 || target > totalPages
    const cls = `h-10 ${withLabel ? 'px-4 gap-1.5' : 'w-10 justify-center'} inline-flex items-center rounded-xl text-sm font-semibold transition-all`
    const style = { color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--surface)' }
    const inner = <>{dir < 0 && <ChevronLeft size={16} />}{withLabel && (dir < 0 ? 'Previous' : 'Next')}{dir > 0 && <ChevronRight size={16} />}</>
    return disabled
      ? <span className={`${cls} opacity-35 cursor-not-allowed`} style={style} aria-disabled="true">{inner}</span>
      : <Link href={href(target)} scroll={!anchor} rel={dir < 0 ? 'prev' : 'next'} aria-label={dir < 0 ? 'Previous page' : 'Next page'} className={cls} style={style}>{inner}</Link>
  }

  const from = perPage ? (page - 1) * perPage + 1 : 0
  const to = perPage && total ? Math.min(page * perPage, total) : 0
  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-col items-center gap-3">
      <div className="hidden sm:flex items-center gap-1.5">
        {arrow(-1, true)}
        <div className="flex items-center gap-1.5 mx-1">{pageItems(page, totalPages, 2).map((p, i) => numberLink(p, i, false))}</div>
        {arrow(1, true)}
      </div>
      <div className="flex sm:hidden items-center gap-1">
        {arrow(-1, false)}
        <div className="flex items-center gap-1 mx-0.5">{pageItems(page, totalPages, 0).map((p, i) => numberLink(p, i, true))}</div>
        {arrow(1, false)}
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {total && perPage
          ? <>Showing <strong style={{ color: 'var(--text-mid)' }}>{from.toLocaleString()}–{to.toLocaleString()}</strong> of {total.toLocaleString()} {itemLabel}</>
          : <>Page {page} of {totalPages}</>}
      </p>
    </nav>
  )
}
