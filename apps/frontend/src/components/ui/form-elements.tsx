import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...p }, r) => (
    <textarea
      className={cn(
        'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm',
        'shadow-sm transition-[border-color,box-shadow] duration-150',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'dark:bg-input/40 dark:border-white/[0.08]',
        'dark:focus-visible:border-primary/50 dark:focus-visible:ring-0 dark:focus-visible:shadow-glow-sm',
        className
      )}
      ref={r}
      {...p}
    />
  )
);
Textarea.displayName = 'Textarea';

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...p }, r) => (
    <label ref={r} className={cn('text-sm font-medium leading-none', className)} {...p} />
  )
);
Label.displayName = 'Label';

/** Shimmer skeleton — replaces plain pulse */
function Skeleton({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-muted',
        'dark:bg-white/[0.05]',
        className
      )}
      {...p}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-primary/[0.06]" />
    </div>
  );
}

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...p }, r) => (
    <select
      ref={r}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm',
        'shadow-sm transition-[border-color] duration-150',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'dark:bg-input/40 dark:border-white/[0.08]',
        'dark:focus-visible:border-primary/50 dark:focus-visible:ring-0',
        className
      )}
      {...p}
    />
  )
);
Select.displayName = 'Select';

export { Textarea, Label, Skeleton, Select };
