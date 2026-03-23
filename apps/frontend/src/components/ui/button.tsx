'use client';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const bv = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/88 ' +
          'dark:hover:shadow-glow-sm dark:hover:brightness-110',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/88',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground ' +
          'dark:border-white/10 dark:bg-transparent dark:hover:bg-white/[0.04] dark:hover:border-primary/30',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/70 ' +
          'dark:bg-white/[0.06] dark:hover:bg-white/[0.1]',
        ghost:
          'hover:bg-accent hover:text-accent-foreground ' +
          'dark:hover:bg-white/[0.05]',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm:      'h-8 rounded-md px-3 text-xs',
        lg:      'h-10 rounded-md px-8',
        icon:    'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof bv> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className={cn(bv({ variant, size, className }))}
      ref={ref}
      {...(props as any)}
    />
  )
);
Button.displayName = 'Button';

export { Button, bv as buttonVariants };
