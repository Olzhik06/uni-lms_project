import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const bv = cva(
  'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground ' +
          'dark:shadow-[0_0_8px_-2px_hsl(var(--primary)/0.5)]',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground ' +
          'dark:bg-white/[0.08] dark:border-white/[0.06] dark:text-foreground/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground',
        outline:
          'border-border text-foreground ' +
          'dark:border-white/10',
        success:
          'border-transparent bg-emerald-100 text-emerald-800 ' +
          'dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-400/20',
        warning:
          'border-transparent bg-amber-100 text-amber-800 ' +
          'dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20',
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
