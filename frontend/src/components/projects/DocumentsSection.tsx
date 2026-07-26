'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  Clock,
  FileText,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  createDocument,
  deleteDocument,
  listDocuments,
} from '@/lib/api';
import SectionShell, { SectionShellAction } from './SectionShell';
import EmptyState from './EmptyState';

export default function DocumentsSection() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.id as string;
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const documentsQuery = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => listDocuments(projectId),
    enabled: Boolean(projectId),
  });

  const createMutation = useMutation({
    mutationFn: (title: string) => createDocument(projectId, title),
    onSuccess: async (document) => {
      await queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      setNewTitle('');
      setShowNew(false);
      router.push(`/projects/${projectId}/documents/${document.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => deleteDocument(projectId, documentId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] }),
  });

  const handleCreate = useCallback(() => {
    const title = newTitle.trim();
    if (title && !createMutation.isPending) {
      createMutation.mutate(title);
    }
  }, [createMutation, newTitle]);

  const docs = documentsQuery.data || [];

  return (
    <SectionShell
      title="Documents"
      description="Long-form documents with rich block editing."
      action={<SectionShellAction label="New Document" onClick={() => setShowNew(true)} />}
    >
      {documentsQuery.isPending ? (
        <div className="flex min-h-48 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : documentsQuery.isError ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-7 w-7 text-error" />
          <p className="text-sm text-on-surface-variant">
            Documents could not be loaded.
          </p>
          <button
            onClick={() => documentsQuery.refetch()}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Try again
          </button>
        </div>
      ) : docs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Create rich documents with headers, lists, code blocks, and more."
          action={
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:saturate-150"
            >
              <Plus className="h-4 w-4" />
              Create Document
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="group relative overflow-hidden rounded-xl border border-white/[0.08] transition-all duration-300 hover:border-primary/20"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)' }}
            >
              <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-primary/3 blur-2xl transition-all duration-500 group-hover:bg-primary/8" />
              <div className="relative flex items-center justify-between p-4 md:p-5">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/[0.05] bg-white/[0.03]">
                    <FileText className="h-5 w-5 text-primary/80" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-on-surface md:text-base">
                      {doc.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-3 text-[10px] font-medium text-outline">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Version {doc.currentVersion}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(doc.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="ml-3 flex flex-shrink-0 items-center gap-1">
                  <button
                    onClick={() => deleteMutation.mutate(doc.id)}
                    disabled={deleteMutation.isPending}
                    className="rounded-lg p-2 opacity-0 transition-all hover:bg-error/10 group-hover:opacity-100 disabled:opacity-40"
                    aria-label={`Delete "${doc.title}"`}
                  >
                    <Trash2 className="h-4 w-4 text-on-surface-variant/30 hover:text-error" />
                  </button>
                  <Link
                    href={`/projects/${projectId}/documents/${doc.id}`}
                    className="rounded-lg p-2 transition-all hover:bg-white/5"
                    aria-label={`Open "${doc.title}"`}
                  >
                    <ArrowRight className="h-4 w-4 text-on-surface-variant/20 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onKeyDown={(event) => event.key === 'Escape' && setShowNew(false)}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNew(false)}
          />
          <div
            className="glass-panel relative z-10 w-full max-w-sm rounded-3xl border border-white/10 p-8 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="New Document"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">New Document</h2>
              <button
                onClick={() => setShowNew(false)}
                className="rounded-full p-2 hover:bg-white/5"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-on-surface-variant" />
              </button>
            </div>
            <input
              type="text"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="Document title"
              className="w-full rounded-xl border border-white/10 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none placeholder:text-outline/50 focus:border-primary"
              autoFocus
              onKeyDown={(event) => event.key === 'Enter' && handleCreate()}
            />
            {createMutation.isError && (
              <p className="mt-3 text-xs text-error">
                The document could not be created. Please try again.
              </p>
            )}
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowNew(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-on-surface-variant hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || createMutation.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 hover:saturate-150 disabled:opacity-50"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionShell>
  );
}
