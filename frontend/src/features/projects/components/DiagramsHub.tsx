import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Loader2,
} from 'lucide-react';
import SectionShell, { SectionShellAction } from './SectionShell';
import EmptyState from './EmptyState';
import {
  listDiagrams,
  createDiagram,
  deleteDiagram as apiDeleteDiagram,
  type Diagram as ApiDiagram,
  type DiagramType,
} from '@/lib/api';

type DiagramFilter = DiagramType | 'all';

interface DiagramItem {
  id: string;
  title: string;
  type: DiagramType;
  updatedAt: string;
  content: unknown;
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

const filters: { id: DiagramFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'db', label: 'Database' },
  { id: 'flowchart', label: 'Flowcharts' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'whiteboard', label: 'Whiteboards' },
];

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffHours = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function getTypeInfo(type: DiagramType) {
  return diagramTypes.find((item) => item.id === type) || diagramTypes[0];
}

function getDiagramHref(projectId: string, diagram: DiagramItem) {
  const path = diagram.type === 'db' ? 'db' : diagram.type;
  return `/projects/${projectId}/diagrams/${path}/${diagram.id}`;
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
  diagram: DiagramItem;
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
                {formatDate(diagram.updatedAt)}
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
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
        className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-black/40 text-on-surface-variant/50 opacity-0 backdrop-blur-md transition-all hover:border-error/30 hover:bg-error/15 hover:text-error group-hover:opacity-100"
        aria-label={`Delete "${diagram.title}"`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {href ? (
        <Link to={href} className="block h-full">
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const projectId = (params.id as string) || '';

  const [showNew, setShowNew] = useState(false);
  const [selectedType, setSelectedType] = useState<DiagramType>('db');
  const [newTitle, setNewTitle] = useState('');
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<DiagramFilter>('all');
  const [query, setQuery] = useState('');

  const {
    data: apiDiagrams = [],
    isLoading,
  } = useQuery({
    queryKey: ['diagrams', projectId],
    queryFn: () => listDiagrams(projectId),
    enabled: !!projectId,
  });

  const diagrams: DiagramItem[] = useMemo(() => {
    return apiDiagrams.map((d: ApiDiagram) => ({
      id: d.id,
      title: d.title,
      type: d.diagramType,
      updatedAt: d.updatedAt,
      content: d.content,
    }));
  }, [apiDiagrams]);

  const createMutation = useMutation({
    mutationFn: (input: { title: string; diagramType: DiagramType }) =>
      createDiagram(projectId, input),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['diagrams', projectId] });
      setShowNew(false);
      setNewTitle('');
      const path = created.diagramType === 'db' ? 'db' : created.diagramType;
      navigate(`/projects/${projectId}/diagrams/${path}/${created.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (diagramId: string) => apiDeleteDiagram(projectId, diagramId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagrams', projectId] });
      setShowDelete(null);
    },
  });

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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const titleToUse = newTitle.trim() || `New ${getTypeInfo(selectedType).label}`;
    createMutation.mutate({
      title: titleToUse,
      diagramType: selectedType,
    });
  };

  return (
    <SectionShell
      title="Diagrams"
      description="Database schemas, architecture diagrams, flowcharts, and whiteboards."
      action={<SectionShellAction label="New Diagram" onClick={() => setShowNew(true)} />}
    >
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : diagrams.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No diagrams yet"
          description="Create database schemas, architecture diagrams, flowcharts, or free-form whiteboards."
          action={
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:saturate-150"
            >
              <Plus className="h-4 w-4" />
              Create Diagram
            </button>
          }
        />
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
                  onDelete={() => setShowDelete(diagram.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Diagram Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="glass-panel relative z-10 w-full max-w-lg rounded-3xl border border-white/10 p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface">New Diagram</h2>
              <button onClick={() => setShowNew(false)} className="rounded-full p-2 transition-all hover:bg-white/5" aria-label="Close">
                <X className="h-5 w-5 text-on-surface-variant" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant/70">
                  Diagram Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Orders & Payments Schema"
                  className="w-full rounded-xl border border-white/10 bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-outline/50 focus:border-primary outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant/70">
                  Select Type
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {diagramTypes.map((type) => {
                    const Icon = type.icon;
                    const styles = typeStyles[type.id];
                    const isSelected = selectedType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? 'border-primary/50 bg-primary/10 shadow-lg shadow-primary/10 ring-1 ring-primary/40'
                            : 'border-white/[0.08] bg-white/[0.015] hover:border-white/15 hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${styles.surface}`}>
                          <Icon className={`h-5 w-5 ${styles.text}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                            {type.label}
                          </div>
                          <div className="truncate text-[11px] text-on-surface-variant/50">
                            {type.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-on-surface-variant hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 hover:saturate-150 transition-all disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>Create Diagram</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDelete(null)} />
          <div className="glass-panel relative z-10 w-full max-w-sm rounded-3xl border border-white/10 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-on-surface mb-2">Delete Diagram?</h3>
            <p className="text-sm text-on-surface-variant/70 mb-6">
              This action cannot be undone. The diagram and all its layout data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant font-medium text-sm hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => showDelete && deleteMutation.mutate(showDelete)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-error text-white font-bold text-sm shadow-lg shadow-error/20 hover:saturate-150 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionShell>
  );
}
