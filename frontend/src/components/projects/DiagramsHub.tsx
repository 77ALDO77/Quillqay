'use client';

import { useState } from 'react';
import { Plus, GitBranch, Database, Network, Workflow, Pencil, Trash2, X, ArrowRight } from 'lucide-react';

interface Diagram {
  id: string;
  title: string;
  type: 'db' | 'architecture' | 'flowchart' | 'whiteboard';
  updatedAt: string;
}

const diagramTypes = [
  { id: 'db', label: 'Database Schema', icon: Database, desc: 'MySQL, PostgreSQL, MariaDB, SQLite' },
  { id: 'architecture', label: 'Architecture', icon: Network, desc: 'System design, microservices, infra' },
  { id: 'flowchart', label: 'Flowchart', icon: Workflow, desc: 'Process flows, algorithms, logic' },
  { id: 'whiteboard', label: 'Whiteboard', icon: Pencil, desc: 'Free drawing, brainstorming, wireframes' },
] as const;

const demoDiagrams: Diagram[] = [
  { id: 'diag-1', title: 'User DB Schema', type: 'db', updatedAt: 'Today' },
  { id: 'diag-2', title: 'Microservices Architecture', type: 'architecture', updatedAt: 'Yesterday' },
  { id: 'diag-3', title: 'Auth Flow', type: 'flowchart', updatedAt: '3 days ago' },
  { id: 'diag-4', title: 'Dashboard Wireframe', type: 'whiteboard', updatedAt: 'Last week' },
];

export default function DiagramsHub() {
  const [diagrams, setDiagrams] = useState<Diagram[]>(demoDiagrams);
  const [showNew, setShowNew] = useState(false);

  const handleCreate = (type: Diagram['type']) => {
    const typeLabel = diagramTypes.find((t) => t.id === type)?.label || type;
    const diagram: Diagram = {
      id: `diag-${Date.now()}`,
      title: `New ${typeLabel}`,
      type,
      updatedAt: 'Just now',
    };
    setDiagrams([diagram, ...diagrams]);
    setShowNew(false);
  };

  const handleDelete = (id: string) => {
    setDiagrams(diagrams.filter((d) => d.id !== id));
  };

  return (
    <div className="glass-panel rounded-3xl border border-white/10 shadow-2xl p-6 md:p-8 min-h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-on-surface mb-2">Diagrams</h1>
          <p className="text-on-surface-variant/70 text-sm">Database schemas, architecture diagrams, flowcharts, and whiteboards.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-on-primary shadow-lg shadow-primary/20 hover:saturate-150 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Diagram
        </button>
      </div>

      {/* Diagrams Grid */}
      {diagrams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <GitBranch className="w-16 h-16 text-outline-variant/30 mb-6" />
          <h3 className="text-lg font-bold text-on-surface mb-2">No diagrams yet</h3>
          <p className="text-on-surface-variant/60 text-sm max-w-sm mb-6">
            Create database schemas, architecture diagrams, flowcharts, or free-form whiteboards.
          </p>
          <button
            onClick={() => setShowNew(true)}
            className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:saturate-150 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Diagram
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {diagrams.map((diagram) => {
            const typeInfo = diagramTypes.find((t) => t.id === diagram.type)!;
            return (
              <div
                key={diagram.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-primary/20 transition-all duration-300"
              >
                {/* Preview area */}
                <div className="h-40 bg-surface-container-lowest flex items-center justify-center border-b border-white/5">
                  <typeInfo.icon className="w-16 h-16 text-outline-variant/20 group-hover:text-primary/30 transition-colors" />
                </div>
                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-on-surface text-sm truncate">{diagram.title}</h3>
                    <button
                      onClick={() => handleDelete(diagram.id)}
                      className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-error/10 transition-all ml-2 flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-on-surface-variant/40 hover:text-error transition-colors" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] text-outline uppercase tracking-widest font-bold">
                      {typeInfo.label}
                    </span>
                    <span className="text-[10px] text-outline font-bold">{diagram.updatedAt}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Diagram Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="glass-panel relative z-10 w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-tight">New Diagram</h2>
              <button onClick={() => setShowNew(false)} className="p-2 rounded-full hover:bg-white/5 transition-all">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
            <p className="text-sm text-on-surface-variant/70 mb-6">Choose the type of diagram you want to create:</p>
            <div className="grid grid-cols-1 gap-3">
              {diagramTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleCreate(type.id)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-primary/30 transition-all text-left group/btn`}
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover/btn:bg-primary/20 transition-colors">
                    <type.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-on-surface text-sm">{type.label}</div>
                    <div className="text-xs text-on-surface-variant/60 mt-0.5">{type.desc}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-on-surface-variant/20 group-hover/btn:text-primary group-hover/btn:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
