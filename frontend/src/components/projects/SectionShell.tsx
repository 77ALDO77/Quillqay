'use client';

import { ReactNode } from 'react';
import { Plus } from 'lucide-react';

interface SectionShellProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionPending?: boolean;
  children: ReactNode;
  /** When true, hides the glass-panel wrapper (for full-bleed layouts like Kanban) */
  fullBleed?: boolean;
}

export default function SectionShell({
  title,
  description,
  actionLabel,
  onAction,
  actionPending,
  children,
  fullBleed = false,
}: SectionShellProps) {
  const content = (
    <>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 md:mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-on-surface">{title}</h1>
          {description && (
            <p className="text-on-surface-variant/60 text-sm mt-1 max-w-lg">{description}</p>
          )}
        </div>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            disabled={actionPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs md:text-sm font-medium bg-primary text-on-primary shadow-lg shadow-primary/20 hover:saturate-150 transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {actionPending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                {actionLabel}
              </>
            )}
          </button>
        )}
      </div>

      {/* Content */}
      {children}
    </>
  );

  if (fullBleed) {
    return <div className="flex flex-col flex-1">{content}</div>;
  }

  return (
    <div className="glass-panel rounded-2xl md:rounded-3xl border border-white/[0.08] shadow-xl p-5 md:p-7 flex flex-col flex-1">
      {content}
    </div>
  );
}
