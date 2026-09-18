import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border border-[rgba(203,1,1,0.25)] bg-[rgba(203,1,1,0.12)] text-primary',
        secondary: 'border border-border bg-muted text-muted-foreground',
        destructive: 'border border-[rgba(244,63,94,0.20)] bg-[rgba(244,63,94,0.10)] text-destructive',
        outline: 'border border-border text-foreground',
        success: 'border border-[rgba(253,113,71,0.25)] bg-[rgba(253,113,71,0.12)] text-[var(--green)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
