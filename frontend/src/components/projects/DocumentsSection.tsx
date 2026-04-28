'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Plus, FileText, Clock, ArrowRight, Trash2, X } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  blocks: number;
  updatedAt: string;
}

const demoDocs: Document[] = [
  { id: 'doc-1', title: 'API Endpoints Reference', blocks: 24, updatedAt: 'Today, 2:30 PM' },
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

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const doc: Document = {
      id: `doc-${Date.now()}`,
      title: newTitle.trim(),
      blocks: 0,
      updatedAt: 'Just now',
    };
    setDocs([doc, ...docs]);
    setNewTitle('');
    setShowNew(false);
  };

  const handleDelete = (id: string) => {
    setDocs(docs.filter((d) => d.id !== id));
  };

  return (
    <div className="glass-panel rounded-3xl border border-white/10 shadow-2xl p-6 md:p-8 min-h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-on-surface mb-2">Documents</h1>
          <p className="text-on-surface-variant/70 text-sm">Long-form documents with rich block editing.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-on-primary shadow-lg shadow-primary/20 hover:saturate-150 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Document
        </button>
      </div>

      {/* Documents List */}
      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="w-16 h-16 text-outline-variant/30 mb-6" />
          <h3 className="text-lg font-bold text-on-surface mb-2">No documents yet</h3>
          <p className="text-on-surface-variant/60 text-sm max-w-sm">
            Create rich documents with headers, lists, code blocks, and more.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="glass-panel group relative overflow-hidden rounded-2xl border border-white/10 hover:border-primary/20 transition-all duration-300"
            >
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/3 rounded-full blur-2xl transition-all duration-500 group-hover:bg-primary/8" />
              <div className="relative flex items-center justify-between p-5">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-on-surface mb-1 truncate">{doc.title}</h3>
                    <div className="flex items-center gap-3 text-[10px] text-outline font-bold">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {doc.blocks} blocks
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {doc.updatedAt}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-error/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-on-surface-variant/40 hover:text-error transition-colors" />
                  </button>
                  <Link
                    href={`/projects/${projectId}/documents/${doc.id}`}
                    className="p-2 rounded-lg hover:bg-white/5 transition-all"
                  >
                    <ArrowRight className="w-5 h-5 text-on-surface-variant/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Document Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="glass-panel relative z-10 w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-tight">New Document</h2>
              <button onClick={() => setShowNew(false)} className="p-2 rounded-full hover:bg-white/5 transition-all">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Document title"
              className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-outline/50 focus:border-primary outline-none"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowNew(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant font-medium text-sm hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:saturate-150 transition-all disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
