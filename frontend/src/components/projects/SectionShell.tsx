'use client';

import { ReactNode, memo } from 'react';
import { Plus } from 'lucide-react';

interface SectionShellHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

function SectionShellHeader({ title, description, children }: SectionShellHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 md:mb-8">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-on-surface">{title}</h1>
        {description && (
          <p className="text-on-surface-variant/60 text-sm mt-1 max-w-lg">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

interface SectionShellActionProps {
  label: string;
  onClick: () => void;
  pending?: boolean;
}

function SectionShellAction({ label, onClick, pending }: SectionShellActionProps) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs md:text-sm font-medium bg-primary text-on-primary shadow-lg shadow-primary/20 hover:saturate-150 transition-all disabled:opacity-50 whitespace-nowrap"
    >
      {pending ? (
        <>
          <div className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
          Creating...
        </>
      ) : (
        <>
          <Plus className="w-4 h-4" />
          {label}
        </>
      )}
    </button>
  );
}

interface SectionShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  fullBleed?: boolean;
}

function SectionShell({
  title,
  description,
  children,
  action,
  fullBleed = false,
}: SectionShellProps) {
  const content = (
    <>
      <SectionShellHeader title={title} description={description}>
        {action}
      </SectionShellHeader>
      {children}
    </>
  );

  if (fullBleed) {
    return <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{content}</div>;
  }

  return (
    <div className="glass-panel custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain rounded-2xl border border-white/[0.08] p-5 shadow-xl md:rounded-3xl md:p-7">
      {content}
    </div>
  );
}

const SectionShellComponent = memo(SectionShell) as unknown as typeof SectionShell & {
  Header: typeof SectionShellHeader;
  Action: typeof SectionShellAction;
};

SectionShellComponent.Header = SectionShellHeader;
SectionShellComponent.Action = SectionShellAction;

export default SectionShellComponent;
export { SectionShellAction, SectionShellHeader };
