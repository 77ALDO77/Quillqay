'use client';

import { useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Loader2,
  MoreHorizontal,
  Share2,
} from 'lucide-react';
import type { Block } from '@/lib/api';

const BlockEditor = dynamic(() => import('@/components/BlockEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[58vh] items-center justify-center rounded-2xl border border-white/10 bg-surface-container-lowest/80 p-8">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  ),
});

const initialDocumentBlocks: Block[] = [
  {
    id: 'document-title',
    type: 'h1',
    data: {
      text: 'Untitled Document',
      level: 1,
    },
  },
];

export default function DocumentEditorPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [title, setTitle] = useState('Untitled Document');
  const [blockCount, setBlockCount] = useState(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSave = useCallback(
    (blocks: Block[]) => {
      const h1Block = blocks.find((block) => {
        const data = block.data as { level?: number; text?: string };
        return data.level === 1 && data.text?.trim();
      });
      const h1Text = (h1Block?.data as { text?: string } | undefined)?.text?.trim();

      if (h1Text) {
        setTitle(h1Text);
      }

      setBlockCount(blocks.length);
      setSaveStatus('saving');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('saved'), 1000);
    },
    []
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/projects/${projectId}/documents`}
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-medium text-on-surface-variant/55 transition-colors hover:bg-white/[0.04] hover:text-on-surface-variant"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to documents
        </Link>

        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-on-surface-variant/65">
            {blockCount} blocks
          </div>
          <SaveStatus status={saveStatus} />
          <button className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-on-surface-variant/60 transition-all hover:bg-white/[0.08] hover:text-on-surface" aria-label="Share document">
            <Share2 className="h-4 w-4" />
          </button>
          <button className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-on-surface-variant/60 transition-all hover:bg-white/[0.08] hover:text-on-surface" aria-label="More document actions">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div
          className="glass-panel custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl border border-white/10 p-4 shadow-xl md:rounded-3xl md:p-6"
          aria-label={title}
        >
          <div className="mx-auto min-h-full max-w-6xl">
            <BlockEditor initialData={initialDocumentBlocks} onChange={handleSave} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SaveStatus({ status }: { status: 'saved' | 'saving' | 'error' }) {
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-on-surface-variant">
        <Loader2 className="w-3 h-3 animate-spin text-primary" />
        Saving...
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span className="flex items-center gap-1 rounded-xl border border-error/20 bg-error/10 px-3 py-2 text-xs text-error">
        <AlertCircle className="w-3 h-3" />
        Error
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 rounded-xl border border-secondary/15 bg-secondary/10 px-3 py-2 text-xs text-on-surface-variant">
      <CheckCircle className="w-3 h-3 text-secondary" />
      Saved
    </span>
  );
}
