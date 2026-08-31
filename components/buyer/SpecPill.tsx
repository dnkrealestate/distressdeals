import { cn } from '@/lib/utils'

/* Small tinted chip for a single spec (beds, baths, area, handover, payment
   plan, …) — shared by PropertyCard and ProjectCard's row layouts so both
   listing types read as one consistent system. */
export function SpecPill({ icon: Icon, children, size = 12, bold = false }: { icon: any; children: React.ReactNode; size?: number; bold?: boolean }) {
  return (
    <span
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg flex-shrink-0 min-w-0"
      style={{ background: 'rgba(49,178,222,0.07)', border: '1px solid rgba(49,178,222,0.15)' }}
    >
      <Icon size={size} style={{ color: 'var(--teal)', flexShrink: 0 }} />
      <span className={cn(bold ? 'font-semibold' : 'font-medium', 'truncate')} style={{ color: 'var(--text-mid)' }}>{children}</span>
    </span>
  )
}
