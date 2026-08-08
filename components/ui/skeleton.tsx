import { cn } from '@/lib/utils'

// Wraps the existing `.shimmer` animation (already defined in globals.css and
// used by every loading state this session) so shadcn-style code can drop in
// `<Skeleton />` without a second, competing skeleton implementation.
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('shimmer rounded-xl', className)} {...props} />
}

export { Skeleton }
