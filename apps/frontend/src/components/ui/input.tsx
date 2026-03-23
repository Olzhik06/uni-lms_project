import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm',
        'shadow-sm transition-[border-color,box-shadow] duration-150',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        // Dark: glass input with teal glow on focus
        'dark:bg-input/40 dark:border-white/[0.08] dark:backdrop-blur-sm',
        'dark:focus-visible:border-primary/50 dark:focus-visible:ring-0 dark:focus-visible:shadow-glow-sm',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
