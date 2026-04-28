'use client';

import { useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const BlockEditor = dynamic(() => import('@/components/BlockEditor'), {
  ssr: false,
  loading: () => (
    <div className="bg-surface-container-lowest rounded-2xl p-8 border border-white/10 min-h-[500px] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  ),
});

export default function DocumentEditorPage() {
  const params = useParams();
  const projectId = params.id as string;
  const docId = params.docId as string;

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [blocks, setBlocks] = useState<any[]>([]);
  const [title, setTitle] = useState('Untitled Document');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSave = useCallback(
    (newBlocks: any[]) => {
      setBlocks(newBlocks);
      setSaveStatus('saving');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('saved');
      }, 1000);
    },
    []
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1c1b1d_0%,#131315_100%)] text-on-surface font-display">
      {/* Background */}
      <div className="fixed top-[-10%] left-[15%] w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* TopNavBar */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-4 md:px-6 py-3 bg-surface/60 backdrop-blur-lg rounded-xl mt-4 mx-4 border border-white/10 shadow-[0_0_15px_rgba(157,92,255,0.1)]">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}/documents`}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-on-surface-variant"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs text-on-surface-variant/50">Documents</span>
          </div>
        </div>

        {/* Save Status */}
        <div className="flex items-center gap-2 text-sm">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-on-surface-variant text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-on-surface-variant text-xs">
              <CheckCircle className="w-3.5 h-3.5 text-secondary" />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-error text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              Error
            </span>
          )}
        </div>
      </header>

      {/* Editor */}
      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="glass-panel rounded-3xl border border-white/10 shadow-2xl p-6 md:p-8">
          {/* Title Input */}
          <input
            type="text"
            defaultValue={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-2xl md:text-3xl font-bold tracking-tighter text-on-surface placeholder:text-outline/40 focus:outline-none border-b-2 border-transparent focus:border-primary transition-colors pb-2 mb-6"
            placeholder="Document Title"
          />

          {/* Editor */}
          <BlockEditor
            initialData={[]}
            onChange={handleSave}
          />
        </div>
      </main>
    </div>
  );
}
