'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Plus, FileText, Clock, ArrowRight, Trash2, X } from 'lucide-react';
import SectionShell, { SectionShellAction } from './SectionShell';
import EmptyState from './EmptyState';

interface Document {
  id: string;
  title: string;
  blocks: number;
  updatedAt: string;
}

const demoDocs: Document[] = [
  { id: 'doc-1', title: 'API Endpoints Reference', blocks: 24, updatedAt: 'Today' },
  { id: 'doc-2', title: 'Architecture Decision Records', blocks: 15, updatedAt: 'Yesterday' },
  { id: 'doc-3', title: 'Onboarding Guide', blocks: 8, updatedAt: '3 days ago' },
  { id: 'doc-4', title: 'Deployment Checklist', blocks: 5, updatedAt: 'Last week' },
];

export default function DocumentsSection() {
  const params = useParams();
  const projectId = params.id as string;
  const [docs, setDocs] = useState<Document[]>(demoDocs);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleCreate = useCallback(() => {
    if (!newTitle.trim()) return;
    setDocs((prev) => [{ id: `doc-${Date.now()}`, title: newTitle.trim(), blocks: 0, updatedAt: 'Just now' }, ...prev]);
    setNewTitle('');
    setShowNew(false);
  }, [newTitle]);

  return (
    <SectionShell
      title="Documents"
      description="Long-form documents with rich block editing."
      action={<SectionShellAction label="New Document" onClick={() => setShowNew(true)} />}
    >
      {docs.length === 0 ? (
        <EmptyState icon={FileText} title="No documents yet" description="Create rich documents with headers, lists, code blocks, and more." action={
          <button onClick={() => setShowNew(true)} className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:saturate-150 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />Create Document
          </button>
        } />
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="group relative overflow-hidden rounded-xl border border-white/[0.08] hover:border-primary/20 transition-all duration-300" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)' }}>
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/3 rounded-full blur-2xl transition-all duration-500 group-hover:bg-primary/8" />
              <div className="relative flex items-center justify-between p-4 md:p-5">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/[0.03] border border-white/[0.05]">
                    <FileText className="w-5 h-5 text-primary/80" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-on-surface text-sm md:text-base truncate">{doc.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-outline font-medium">
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{doc.blocks} blocks</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{doc.updatedAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                  <button onClick={() => setDocs(docs.filter((d) => d.id !== doc.id))} className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-error/10 transition-all" aria-label={`Delete "${doc.title}"`}>
                    <Trash2 className="w-4 h-4 text-on-surface-variant/30 hover:text-error" />
                  </button>
                  <Link href={`/projects/${projectId}/documents/${doc.id}`} className="p-2 rounded-lg hover:bg-white/5 transition-all" aria-label={`Open "${doc.title}"`}>
                    <ArrowRight className="w-4 h-4 text-on-surface-variant/20 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={(e) => e.key === 'Escape' && setShowNew(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="glass-panel relative z-10 w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl p-8" role="dialog" aria-modal="true" aria-label="New Document">
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-bold">New Document</h2><button onClick={() => setShowNew(false)} className="p-2 rounded-full hover:bg-white/5" aria-label="Close"><X className="w-5 h-5 text-on-surface-variant" /></button></div>
            <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Document title" className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-outline/50 focus:border-primary outline-none" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowNew(false)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant text-sm font-medium hover:bg-white/10">Cancel</button>
              <button onClick={handleCreate} disabled={!newTitle.trim()} className="flex-1 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-lg shadow-primary/20 hover:saturate-150 disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}
    </SectionShell>
  );
}
