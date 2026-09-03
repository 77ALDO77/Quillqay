import { useCallback, useEffect, useRef, useState, Suspense, lazy } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Share2,
} from 'lucide-react';
import {
  ApiError,
  getDocument,
  renameDocument,
  saveDocument,
  type Block,
} from '@/lib/api';

const BlockEditor = lazy(() => import('@/components/BlockEditor'));

type SaveState = 'saved' | 'saving' | 'error' | 'conflict';

export default function DocumentEditorPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.id as string;
  const documentId = params.docId as string;
  const [saveStatus, setSaveStatus] = useState<SaveState>('saved');
  const [title, setTitle] = useState('');
  const [blockCount, setBlockCount] = useState<number | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const versionRef = useRef<number | null>(null);
  const savedTitleRef = useRef<string | null>(null);

  const documentQuery = useQuery({
    queryKey: ['document', projectId, documentId],
    queryFn: () => getDocument(projectId, documentId),
    enabled: Boolean(projectId && documentId),
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 404) && failureCount < 2,
  });

  useEffect(
    () => () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    },
    [],
  );

  const handleSave = useCallback(
    (blocks: Block[]) => {
      const h1Block = blocks.find((block) => {
        const data = block.data as { level?: number; text?: string };
        return data.level === 1 && data.text?.trim();
      });
      const nextTitle =
        (h1Block?.data as { text?: string } | undefined)?.text?.trim() ||
        title ||
        documentQuery.data?.document.title ||
        'Untitled Document';

      setTitle(nextTitle);
      setBlockCount(blocks.length);
      setSaveStatus('saving');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const version = await saveDocument(
            projectId,
            documentId,
            versionRef.current ??
              documentQuery.data?.document.currentVersion ??
              0,
            {
              schemaVersion: 1,
              editor: 'editorjs',
              time: Date.now(),
              version: '2.30',
              blocks,
            },
          );
          versionRef.current = version.version;

          const savedTitle =
            savedTitleRef.current ?? documentQuery.data?.document.title;
          if (nextTitle !== savedTitle) {
            await renameDocument(projectId, documentId, nextTitle);
            savedTitleRef.current = nextTitle;
          }

          setSaveStatus('saved');
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ['documents', projectId],
            }),
            queryClient.invalidateQueries({
              queryKey: ['document', projectId, documentId],
              refetchType: 'none',
            }),
          ]);
        } catch (error) {
          setSaveStatus(
            error instanceof ApiError && error.status === 409
              ? 'conflict'
              : 'error',
          );
        }
      }, 1000);
    },
    [documentId, documentQuery.data, projectId, queryClient, title],
  );

  if (documentQuery.isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (documentQuery.isError || !documentQuery.data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-8 w-8 text-error" />
        <p className="text-sm text-on-surface-variant">
          This document could not be loaded.
        </p>
        <button
          onClick={() => documentQuery.refetch()}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  }

  const initialBlocks =
    documentQuery.data.content.blocks.length > 0
      ? documentQuery.data.content.blocks
      : [
          {
            id: `title-${documentId}`,
            type: 'h1',
            data: { text: documentQuery.data.document.title, level: 1 },
          },
        ];
  const displayTitle = title || documentQuery.data.document.title;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/projects/${projectId}/documents`}
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-medium text-on-surface-variant/55 transition-colors hover:bg-white/[0.04] hover:text-on-surface-variant"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to documents
        </Link>

        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-on-surface-variant/65">
            {blockCount ?? documentQuery.data.content.blocks.length} blocks
          </div>
          <SaveStatus status={saveStatus} />
          <button
            className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-on-surface-variant/60 transition-all hover:bg-white/[0.08] hover:text-on-surface"
            aria-label="Share document"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-on-surface-variant/60 transition-all hover:bg-white/[0.08] hover:text-on-surface"
            aria-label="More document actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div
          className="glass-panel custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl border border-white/10 p-4 shadow-xl md:rounded-3xl md:p-6"
          aria-label={displayTitle}
        >
          <div className="mx-auto min-h-full max-w-6xl">
            <Suspense
              fallback={
                <div className="flex min-h-[58vh] items-center justify-center rounded-2xl border border-white/10 bg-surface-container-lowest/80 p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }
            >
              <BlockEditor initialData={initialBlocks} onChange={handleSave} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

function SaveStatus({ status }: { status: SaveState }) {
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-on-surface-variant">
        <Loader2 className="h-3 w-3 animate-spin text-primary" />
        Saving...
      </span>
    );
  }

  if (status === 'conflict') {
    return (
      <span
        className="flex items-center gap-1 rounded-xl border border-error/20 bg-error/10 px-3 py-2 text-xs text-error"
        title="Reload before continuing so newer changes are not overwritten."
      >
        <AlertCircle className="h-3 w-3" />
        Newer version
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span className="flex items-center gap-1 rounded-xl border border-error/20 bg-error/10 px-3 py-2 text-xs text-error">
        <AlertCircle className="h-3 w-3" />
        Error
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 rounded-xl border border-secondary/15 bg-secondary/10 px-3 py-2 text-xs text-on-surface-variant">
      <CheckCircle className="h-3 w-3 text-secondary" />
      Saved
    </span>
  );
}
