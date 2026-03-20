import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const bv = cva(
  'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-primary text-primary-foreground',
        secondary:   'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline:     'border-border text-foreground',
        success:     'border-transparent bg-emerald-100 text-emerald-800',
        warning:     'border-transparent bg-amber-100 text-amber-800',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof bv> {}

function Badge({ className, variant, ...p }: BadgeProps) {
  return <div className={cn(bv({ variant }), className)} {...p} />;
}

export { Badge, bv as badgeVariants };
