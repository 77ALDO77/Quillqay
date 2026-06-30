'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, GitBranch, Database, Network, Workflow, Pencil, Trash2, X, ArrowRight } from 'lucide-react';
import SectionShell, { SectionShellAction } from './SectionShell';
import EmptyState from './EmptyState';

interface Diagram {
  id: string;
  title: string;
  type: 'db' | 'architecture' | 'flowchart' | 'whiteboard';
  updatedAt: string;
}

const diagramTypes = [
  { id: 'db' as const, label: 'Database Schema', icon: Database, desc: 'MySQL, PostgreSQL, MariaDB, SQLite' },
  { id: 'architecture' as const, label: 'Architecture', icon: Network, desc: 'System design, microservices, infra' },
  { id: 'flowchart' as const, label: 'Flowchart', icon: Workflow, desc: 'Process flows, algorithms, logic' },
  { id: 'whiteboard' as const, label: 'Whiteboard', icon: Pencil, desc: 'Free drawing, brainstorming' },
];

const demoDiagrams: Diagram[] = [
  { id: 'diag-1', title: 'Employees DB Schema', type: 'db', updatedAt: 'Today' },
  { id: 'diag-2', title: 'E-Commerce Schema', type: 'db', updatedAt: 'Yesterday' },
  { id: 'diag-3', title: 'User Auth Flow', type: 'flowchart', updatedAt: '3 days ago' },
  { id: 'diag-4', title: 'Payment Process', type: 'flowchart', updatedAt: '2 days ago' },
  { id: 'diag-5', title: 'API Architecture', type: 'architecture', updatedAt: 'Last week' },
  { id: 'diag-6', title: 'Team Brainstorm', type: 'whiteboard', updatedAt: 'Today' },
];

function CardContent({ diagram, typeInfo, onDelete }: { diagram: Diagram; typeInfo: typeof diagramTypes[number]; onDelete: () => void }) {
  return (
    <>
      <div className="h-36 bg-surface-container-lowest flex items-center justify-center border-b border-white/[0.05]">
        <typeInfo.icon className="w-14 h-14 text-outline-variant/15 group-hover:text-primary/25 transition-colors" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-on-surface text-sm truncate">{diagram.title}</h3>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }} className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-error/10 transition-all ml-2 flex-shrink-0" aria-label={`Delete "${diagram.title}"`}>
            <Trash2 className="w-3 h-3 text-on-surface-variant/30 hover:text-error" />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-[10px] text-outline uppercase tracking-widest font-bold">{typeInfo.label}</span>
          <span className="text-[10px] text-outline font-medium">{diagram.updatedAt}</span>
        </div>
      </div>
    </>
  );
}

export default function DiagramsHub() {
  const params = useParams();
  const projectId = params.id as string;
  const [diagrams, setDiagrams] = useState<Diagram[]>(demoDiagrams);
  const [showNew, setShowNew] = useState(false);

  const handleCreate = (type: Diagram['type']) => {
    const typeLabel = diagramTypes.find((t) => t.id === type)?.label || type;
    setDiagrams([{ id: `diag-${Date.now()}`, title: `New ${typeLabel}`, type, updatedAt: 'Just now' }, ...diagrams]);
    setShowNew(false);
  };

  return (
    <SectionShell
      title="Diagrams"
      description="Database schemas, architecture diagrams, flowcharts, and whiteboards."
      action={<SectionShellAction label="New Diagram" onClick={() => setShowNew(true)} />}
    >
      {diagrams.length === 0 ? (
        <EmptyState icon={GitBranch} title="No diagrams yet" description="Create database schemas, architecture diagrams, flowcharts, or free-form whiteboards." action={
          <button onClick={() => setShowNew(true)} className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:saturate-150 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />Create Diagram
          </button>
        } />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {diagrams.map((diagram) => {
            const typeInfo = diagramTypes.find((t) => t.id === diagram.type)!;
            return (
              <div key={diagram.id} className="group relative overflow-hidden rounded-2xl border border-white/[0.08] hover:border-primary/20 transition-all duration-300">
                {diagram.type === 'db' ? (
                  <Link href={`/projects/${projectId}/diagrams/db/${diagram.id}`} className="block">
                    <CardContent diagram={diagram} typeInfo={typeInfo} onDelete={() => setDiagrams(diagrams.filter((d) => d.id !== diagram.id))} />
                  </Link>
                ) : diagram.type === 'flowchart' ? (
                  <Link href={`/projects/${projectId}/diagrams/flowchart/${diagram.id}`} className="block">
                    <CardContent diagram={diagram} typeInfo={typeInfo} onDelete={() => setDiagrams(diagrams.filter((d) => d.id !== diagram.id))} />
                  </Link>
                ) : diagram.type === 'whiteboard' ? (
                  <Link href={`/projects/${projectId}/diagrams/whiteboard/${diagram.id}`} className="block">
                    <CardContent diagram={diagram} typeInfo={typeInfo} onDelete={() => setDiagrams(diagrams.filter((d) => d.id !== diagram.id))} />
                  </Link>
                ) : (
                  <CardContent diagram={diagram} typeInfo={typeInfo} onDelete={() => setDiagrams(diagrams.filter((d) => d.id !== diagram.id))} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="glass-panel relative z-10 w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-bold">New Diagram</h2><button onClick={() => setShowNew(false)} className="p-2 rounded-full hover:bg-white/5"><X className="w-5 h-5 text-on-surface-variant" /></button></div>
            <p className="text-sm text-on-surface-variant/60 mb-5">Choose the type of diagram you want to create:</p>
            <div className="grid grid-cols-1 gap-2">
              {diagramTypes.map((type) => (
                <button key={type.id} onClick={() => handleCreate(type.id)} className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.01] hover:bg-white/[0.04] hover:border-primary/30 transition-all text-left group/btn">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover/btn:bg-primary/20 transition-colors">
                    <type.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-on-surface text-sm">{type.label}</div>
                    <div className="text-xs text-on-surface-variant/50 mt-0.5">{type.desc}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-on-surface-variant/15 group-hover/btn:text-primary group-hover/btn:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </SectionShell>
  );
}
