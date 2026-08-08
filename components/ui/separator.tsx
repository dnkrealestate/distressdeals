'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

// Note: a plain visual divider doesn't need Radix's Separator primitive (no
// interaction/ARIA behavior beyond role="separator"), so this stays a bare
// div matching the existing `.divider` class exactly rather than pulling in
// another Radix package for a single-purpose line.
const Separator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: 'horizontal' | 'vertical' }
>(({ className, orientation = 'horizontal', ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    aria-orientation={orientation}
    className={cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      className
    )}
    {...props}
  />
))
Separator.displayName = 'Separator'

export { Separator }
