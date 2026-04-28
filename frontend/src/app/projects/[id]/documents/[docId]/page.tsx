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
  const [title, setTitle] = useState('Untitled Document');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSave = useCallback(
    (_blocks: any[]) => {
      setSaveStatus('saving');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('saved'), 1000);
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* Back link + save status */}
      <div className="flex items-center justify-between">
        <Link
          href={`/projects/${projectId}/documents`}
          className="flex items-center gap-2 text-xs text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to documents
        </Link>
        <div className="flex items-center gap-2 text-xs">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-on-surface-variant">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-on-surface-variant">
              <CheckCircle className="w-3 h-3 text-secondary" />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-error">
              <AlertCircle className="w-3 h-3" />
              Error
            </span>
          )}
        </div>
      </div>

      {/* Editor Card */}
      <div className="glass-panel rounded-2xl border border-white/10 p-6 md:p-8 shadow-xl">
        <input
          type="text"
          defaultValue={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-2xl md:text-3xl font-bold tracking-tighter text-on-surface placeholder:text-outline/40 focus:outline-none border-b-2 border-transparent focus:border-primary transition-colors pb-2 mb-6"
          placeholder="Document Title"
        />
        <BlockEditor initialData={[]} onChange={handleSave} />
      </div>
    </div>
  );
}
