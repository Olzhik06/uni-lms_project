'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type DialogContextValue = {
  titleId: string;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const titleId = React.useId();
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Keep a stable ref so the keydown handler always calls the latest
  // onOpenChange without adding it to the effect's dependency array.
  // If onOpenChange were in deps (and callers pass inline functions), the
  // effect would re-run on every parent render, invoking focusable?.focus()
  // after every keystroke and stealing focus away from the active input.
  const onOpenChangeRef = React.useRef(onOpenChange);
  React.useEffect(() => { onOpenChangeRef.current = onOpenChange; });

  React.useEffect(() => {
    if (!open) return;

    const previousActive = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Prefer a real input/select/textarea over a plain button (e.g. the close X).
    // Falls back to any focusable if no form control is present.
    const inputFirst = contentRef.current?.querySelector<HTMLElement>(
      'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])',
    );
    const fallback = contentRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]):not([aria-label="Close dialog"]), [href], [tabindex]:not([tabindex="-1"])',
    );
    (inputFirst ?? fallback)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChangeRef.current(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousActive?.focus?.();
    };
  }, [open]); // intentionally excludes onOpenChange — use ref above instead

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ titleId }}>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <div
          className="fixed inset-0 bg-black/50"
          aria-hidden="true"
          onClick={() => onOpenChange(false)}
        />
        <div
          ref={contentRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative z-50 mx-0 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-x border-t bg-background p-6 shadow-lg sm:mx-4 sm:rounded-xl sm:border"
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close dialog"
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col space-y-1.5', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const ctx = React.useContext(DialogContext);
  return <h2 id={ctx?.titleId} className={cn('text-lg font-semibold', className)} {...props} />;
}
