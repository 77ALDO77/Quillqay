'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Clock3,
  Database,
  GitBranch,
  Network,
  Pencil,
  Plus,
  Search,
  Trash2,
  Workflow,
  X,
} from 'lucide-react';
import SectionShell, { SectionShellAction } from './SectionShell';
import EmptyState from './EmptyState';

type DiagramType = 'db' | 'architecture' | 'flowchart' | 'whiteboard';
type DiagramFilter = DiagramType | 'all';

interface Diagram {
  id: string;
  title: string;
  type: DiagramType;
  updatedAt: string;
}

const diagramTypes = [
  { id: 'db' as const, label: 'Database Schema', shortLabel: 'Database', icon: Database, desc: 'MySQL, PostgreSQL, MariaDB, SQLite' },
  { id: 'architecture' as const, label: 'Architecture', shortLabel: 'Architecture', icon: Network, desc: 'System design, microservices, infra' },
  { id: 'flowchart' as const, label: 'Flowchart', shortLabel: 'Flowchart', icon: Workflow, desc: 'Process flows, algorithms, logic' },
  { id: 'whiteboard' as const, label: 'Whiteboard', shortLabel: 'Whiteboard', icon: Pencil, desc: 'Free drawing, brainstorming' },
];

const typeStyles: Record<DiagramType, {
  chip: string;
  accent: string;
  surface: string;
  glow: string;
  text: string;
}> = {
  db: {
    chip: 'border-cyan-200/20 bg-cyan-200/10 text-cyan-100',
    accent: 'from-cyan-200 via-cyan-100 to-primary',
    surface: 'bg-cyan-200/10 border-cyan-200/20',
    glow: 'shadow-cyan-300/10',
    text: 'text-cyan-100',
  },
  architecture: {
    chip: 'border-emerald-200/20 bg-emerald-200/10 text-emerald-100',
    accent: 'from-emerald-200 via-primary to-sky-200',
    surface: 'bg-emerald-200/10 border-emerald-200/20',
    glow: 'shadow-emerald-300/10',
    text: 'text-emerald-100',
  },
  flowchart: {
    chip: 'border-primary/25 bg-primary/12 text-primary',
    accent: 'from-primary via-purple-200 to-pink-200',
    surface: 'bg-primary/10 border-primary/20',
    glow: 'shadow-primary/10',
    text: 'text-primary',
  },
  whiteboard: {
    chip: 'border-pink-200/25 bg-pink-200/10 text-pink-100',
    accent: 'from-pink-200 via-rose-200 to-primary',
    surface: 'bg-pink-200/10 border-pink-200/20',
    glow: 'shadow-pink-300/10',
    text: 'text-pink-100',
  },
};

const demoDiagrams: Diagram[] = [
  { id: 'diag-1', title: 'Employees DB Schema', type: 'db', updatedAt: 'Today' },
  { id: 'diag-2', title: 'E-Commerce Schema', type: 'db', updatedAt: 'Yesterday' },
  { id: 'diag-3', title: 'User Auth Flow', type: 'flowchart', updatedAt: '3 days ago' },
  { id: 'diag-4', title: 'Payment Process', type: 'flowchart', updatedAt: '2 days ago' },
  { id: 'diag-5', title: 'API Architecture', type: 'architecture', updatedAt: 'Last week' },
  { id: 'diag-6', title: 'Team Brainstorm', type: 'whiteboard', updatedAt: 'Today' },
];

const filters: { id: DiagramFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'db', label: 'Database' },
  { id: 'flowchart', label: 'Flowcharts' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'whiteboard', label: 'Whiteboards' },
];

function getTypeInfo(type: DiagramType) {
  return diagramTypes.find((item) => item.id === type)!;
}

function getDiagramHref(projectId: string, diagram: Diagram) {
  if (diagram.type === 'architecture') return undefined;
  return `/projects/${projectId}/diagrams/${diagram.type === 'db' ? 'db' : diagram.type}/${diagram.id}`;
}

function DiagramPreview({ type }: { type: DiagramType }) {
  const typeInfo = getTypeInfo(type);
  const styles = typeStyles[type];
  const Icon = typeInfo.icon;

  return (
    <div className="relative grid h-36 place-items-center overflow-hidden bg-surface-container-lowest">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${styles.accent}`} />
      <div className={`absolute h-28 w-28 rounded-full border blur-xl ${styles.surface}`} />
      <div className={`relative grid h-20 w-20 place-items-center rounded-3xl border ${styles.surface} shadow-2xl ${styles.glow} transition-transform duration-300 group-hover:scale-105`}>
        <Icon className={`h-11 w-11 ${styles.text}`} strokeWidth={1.8} />
      </div>
    </div>
  );
}

function DiagramCard({
  diagram,
  href,
  onDelete,
}: {
  diagram: Diagram;
  href?: string;
  onDelete: () => void;
}) {
  const typeInfo = getTypeInfo(diagram.type);
  const styles = typeStyles[diagram.type];
  const Icon = typeInfo.icon;
  const body = (
    <>
      <DiagramPreview type={diagram.type} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-on-surface">{diagram.title}</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${styles.chip}`}>
                <Icon className="h-3 w-3" />
                {typeInfo.shortLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant/60">
                <Clock3 className="h-3.5 w-3.5" />
                {diagram.updatedAt}
              </span>
            </div>
          </div>
          {href && <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-on-surface-variant/25 transition-all group-hover:translate-x-1 group-hover:text-primary" />}
        </div>
      </div>
    </>
  );

  return (
    <article className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.015] shadow-2xl ${styles.glow} transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.025]`}>
      <button
        onClick={onDelete}
        className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-black/30 text-on-surface-variant/45 opacity-0 backdrop-blur-md transition-all hover:border-error/25 hover:bg-error/10 hover:text-error group-hover:opacity-100"
        aria-label={`Delete "${diagram.title}"`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {href ? (
        <Link href={href} className="block h-full">
          {body}
        </Link>
      ) : (
        body
      )}
    </article>
  );
}

export default function DiagramsHub() {
  const params = useParams();
  const projectId = params.id as string;
  const [diagrams, setDiagrams] = useState<Diagram[]>(demoDiagrams);
  const [showNew, setShowNew] = useState(false);
  const [activeFilter, setActiveFilter] = useState<DiagramFilter>('all');
  const [query, setQuery] = useState('');
  const [nextDiagramId, setNextDiagramId] = useState(7);

  const visibleDiagrams = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return diagrams.filter((diagram) => {
      const matchesFilter = activeFilter === 'all' || diagram.type === activeFilter;
      const typeInfo = getTypeInfo(diagram.type);
      const matchesQuery =
        normalizedQuery.length === 0 ||
        diagram.title.toLowerCase().includes(normalizedQuery) ||
        typeInfo.label.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, diagrams, query]);

  const recentCount = diagrams.filter((diagram) => diagram.updatedAt === 'Today' || diagram.updatedAt === 'Just now').length;

  const handleCreate = (type: DiagramType) => {
    const typeLabel = getTypeInfo(type).label;
    setDiagrams((current) => [
      { id: `diag-${nextDiagramId}`, title: `New ${typeLabel}`, type, updatedAt: 'Just now' },
      ...current,
    ]);
    setNextDiagramId((current) => current + 1);
    setShowNew(false);
  };

  const deleteDiagram = (id: string) => {
    setDiagrams((current) => current.filter((diagram) => diagram.id !== id));
  };

  return (
    <SectionShell
      title="Diagrams"
      description="Database schemas, architecture diagrams, flowcharts, and whiteboards."
      action={<SectionShellAction label="New Diagram" onClick={() => setShowNew(true)} />}
    >
      {diagrams.length === 0 ? (
        <EmptyState icon={GitBranch} title="No diagrams yet" description="Create database schemas, architecture diagrams, flowcharts, or free-form whiteboards." action={
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:saturate-150">
            <Plus className="h-4 w-4" />Create Diagram
          </button>
        } />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant/45" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search diagrams"
                className="h-14 w-full rounded-2xl border border-white/[0.08] bg-surface-container-lowest/60 pl-12 pr-4 text-sm font-semibold text-on-surface outline-none transition-all placeholder:text-on-surface-variant/45 focus:border-primary/35 focus:bg-white/[0.025]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/55">Total</div>
                <div className="text-lg font-bold text-on-surface">{diagrams.length} diagrams</div>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/55">Recent</div>
                <div className="text-lg font-bold text-on-surface">{recentCount} active</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`shrink-0 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                  activeFilter === filter.id
                    ? 'border-primary/35 bg-primary/15 text-primary shadow-lg shadow-primary/10'
                    : 'border-white/[0.08] bg-white/[0.015] text-on-surface-variant/65 hover:border-white/15 hover:bg-white/[0.04] hover:text-on-surface'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {visibleDiagrams.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] py-16">
              <EmptyState icon={Search} title="No matching diagrams" description="Try a different search or filter." />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleDiagrams.map((diagram) => (
                <DiagramCard
                  key={diagram.id}
                  diagram={diagram}
                  href={getDiagramHref(projectId, diagram)}
                  onDelete={() => deleteDiagram(diagram.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="glass-panel relative z-10 w-full max-w-lg rounded-3xl border border-white/10 p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">New Diagram</h2>
              <button onClick={() => setShowNew(false)} className="rounded-full p-2 transition-all hover:bg-white/5" aria-label="Close">
                <X className="h-5 w-5 text-on-surface-variant" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {diagramTypes.map((type) => {
                const Icon = type.icon;
                const styles = typeStyles[type.id];
                return (
                  <button key={type.id} onClick={() => handleCreate(type.id)} className="group/btn flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.01] p-4 text-left transition-all hover:border-primary/30 hover:bg-white/[0.04]">
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${styles.surface} transition-colors`}>
                      <Icon className={`h-5 w-5 ${styles.text}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-on-surface">{type.label}</div>
                      <div className="mt-0.5 text-xs text-on-surface-variant/50">{type.desc}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-on-surface-variant/15 transition-all group-hover/btn:translate-x-1 group-hover/btn:text-primary" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </SectionShell>
  );
}
