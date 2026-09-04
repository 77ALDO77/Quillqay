import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  const navigate = useNavigate();
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
      navigate(`/projects/${projectId}/documents/${document.id}`);
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

  return (
    <SectionShell
      title="Documents"
      description="Long-form rich-text documents with block editor."
      action={<SectionShellAction label="New Document" onClick={() => setShowNew(true)} />}
    >
      {documentsQuery.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : documentsQuery.isError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <AlertCircle className="h-8 w-8 text-error" />
          <p className="text-sm text-on-surface-variant">The documents could not be loaded.</p>
          <button
            onClick={() => documentsQuery.refetch()}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold hover:bg-white/5"
          >
            Retry
          </button>
        </div>
      ) : !documentsQuery.data || documentsQuery.data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Create your first rich-text document with headers, lists, code blocks, and checklists."
          action={
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 hover:saturate-150"
            >
              <Plus className="h-4 w-4" />
              Create Document
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documentsQuery.data.map((doc) => (
            <div
              key={doc.id}
              className="glass-panel group relative flex flex-col justify-between rounded-2xl border border-white/10 p-5 transition-all hover:border-primary/40 hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={`/projects/${projectId}/documents/${doc.id}`}
                      className="block truncate text-sm font-semibold text-on-surface hover:text-primary"
                    >
                      {doc.title}
                    </Link>
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
                    to={`/projects/${projectId}/documents/${doc.id}`}
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
