import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Archive,
  Bell,
  CalendarDays,
  Copy,
  Loader2,
  Palette,
  Pencil,
  Pin,
  Plus,
  RefreshCw,
  Search,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';
import {
  listNotes,
  createNote,
  updateNote,
  deleteNote as apiDeleteNote,
  type Note,
  type NoteColor,
} from '@/lib/api';
import SectionShell, { SectionShellAction } from './SectionShell';
import EmptyState from './EmptyState';

const noteColors: NoteColor[] = ['primary', 'secondary', 'tertiary'];

const noteStyles = {
  primary: {
    accent: 'bg-primary',
    ring: 'ring-primary/40',
    border: 'hover:border-primary/35',
    glow: 'group-hover:bg-primary/10',
    icon: 'text-primary',
    chip: 'bg-primary/10 text-primary border-primary/15',
  },
  secondary: {
    accent: 'bg-secondary',
    ring: 'ring-secondary/40',
    border: 'hover:border-secondary/35',
    glow: 'group-hover:bg-secondary/10',
    icon: 'text-secondary',
    chip: 'bg-secondary/10 text-secondary border-secondary/15',
  },
  tertiary: {
    accent: 'bg-tertiary',
    ring: 'ring-tertiary/40',
    border: 'hover:border-tertiary/35',
    glow: 'group-hover:bg-tertiary/10',
    icon: 'text-tertiary',
    chip: 'bg-tertiary/10 text-tertiary border-tertiary/15',
  },
} satisfies Record<NoteColor, Record<string, string>>;

function formatNoteDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffHours = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export default function NotesSection() {
  const params = useParams<{ id: string }>();
  const projectId = params.id as string;
  const queryClient = useQueryClient();

  const [query, setQuery] = useState('');
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const [draftColor, setDraftColor] = useState<NoteColor>('primary');
  const [draftPinned, setDraftPinned] = useState(false);

  const {
    data: notes = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notes', projectId],
    queryFn: () => listNotes(projectId),
    enabled: Boolean(projectId),
  });

  const createMutation = useMutation({
    mutationFn: (input: { text: string; color: NoteColor; pinned: boolean }) =>
      createNote(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', projectId] });
      closeEditor();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      noteId,
      input,
    }: {
      noteId: string;
      input: { text?: string; color?: NoteColor; pinned?: boolean };
    }) => updateNote(projectId, noteId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', projectId] });
      closeEditor();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => apiDeleteNote(projectId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', projectId] });
      closeEditor();
    },
  });

  const openCreate = useCallback(() => {
    setEditorMode('create');
    setActiveNoteId(null);
    setDraftText('');
    setDraftColor('primary');
    setDraftPinned(false);
  }, []);

  const openEdit = useCallback((note: Note) => {
    setEditorMode('edit');
    setActiveNoteId(note.id);
    setDraftText(note.text);
    setDraftColor(note.color);
    setDraftPinned(Boolean(note.pinned));
  }, []);

  const closeEditor = useCallback(() => {
    setEditorMode(null);
    setActiveNoteId(null);
    setDraftText('');
    setDraftColor('primary');
    setDraftPinned(false);
  }, []);

  const saveEditor = useCallback(() => {
    const text = draftText.trim();
    if (!text) {
      closeEditor();
      return;
    }

    if (editorMode === 'edit' && activeNoteId) {
      updateMutation.mutate({
        noteId: activeNoteId,
        input: { text, color: draftColor, pinned: draftPinned },
      });
    } else {
      createMutation.mutate({
        text,
        color: draftColor,
        pinned: draftPinned,
      });
    }
  }, [
    activeNoteId,
    closeEditor,
    createMutation,
    draftColor,
    draftPinned,
    draftText,
    editorMode,
    updateMutation,
  ]);

  const handleDelete = useCallback(
    (noteId: string) => {
      deleteMutation.mutate(noteId);
    },
    [deleteMutation]
  );

  const deleteActiveNote = useCallback(() => {
    if (!activeNoteId) return;
    deleteMutation.mutate(activeNoteId);
  }, [activeNoteId, deleteMutation]);

  const duplicateDraft = useCallback(() => {
    const text = draftText.trim();
    if (!text) return;
    createMutation.mutate({
      text,
      color: draftColor,
      pinned: draftPinned,
    });
  }, [createMutation, draftColor, draftPinned, draftText]);

  const togglePin = useCallback(
    (note: Note, e: React.MouseEvent) => {
      e.stopPropagation();
      updateMutation.mutate({
        noteId: note.id,
        input: { pinned: !note.pinned },
      });
    },
    [updateMutation]
  );

  const visibleNotes = notes
    .filter((note) => note.text.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));

  const recentNotes = notes.filter((note) => {
    try {
      const d = new Date(note.createdAt);
      const diffDays = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 2;
    } catch {
      return false;
    }
  }).length;

  const activeStyle = noteStyles[draftColor] || noteStyles.primary;
  const editorTitle = editorMode === 'edit' ? 'Edit Note' : 'New Note';

  return (
    <SectionShell
      title="Notes"
      description="Quick ideas, todos, and reminders for this project."
      action={<SectionShellAction label="New Note" onClick={openCreate} />}
    >
      <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/35" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notes..."
            className="h-11 w-full rounded-xl border border-white/10 bg-surface-container-low/70 pl-10 pr-4 text-sm text-on-surface outline-none transition-all placeholder:text-outline/50 focus:border-primary/60 focus:shadow-[0_0_0_2px_rgba(214,186,255,0.1)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-outline">Total</div>
            <div className="text-sm font-bold text-on-surface">{notes.length} notes</div>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-outline">Recent</div>
            <div className="text-sm font-bold text-on-surface">{recentNotes} active</div>
          </div>
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="glass-panel h-44 rounded-2xl border border-white/10 p-4 flex flex-col justify-between animate-pulse"
            >
              <div>
                <div className="w-14 h-4 bg-white/10 rounded-full mb-3" />
                <div className="w-full h-4 bg-white/5 rounded mb-2" />
                <div className="w-3/4 h-4 bg-white/5 rounded" />
              </div>
              <div className="w-20 h-3 bg-white/10 rounded pt-3 border-t border-white/5" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && isError && (
        <div className="flex flex-col items-center justify-center py-16 text-center glass-panel rounded-2xl border border-error/20 p-8">
          <AlertCircle className="w-12 h-12 text-error mb-4" />
          <h3 className="text-lg font-bold text-on-surface mb-2">Failed to load notes</h3>
          <p className="text-sm text-on-surface-variant/70 max-w-md mb-6">
            {(error as Error)?.message || 'Could not connect to the backend server.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      )}

      {/* Empty States */}
      {!isLoading && !isError && notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Jot down quick thoughts, reminders, or tasks for this project."
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:saturate-150"
            >
              <Plus className="h-4 w-4" />
              Create Note
            </button>
          }
        />
      ) : !isLoading && !isError && visibleNotes.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching notes"
          description="Try a different search term or create a fresh note."
          action={
            <button
              onClick={() => setQuery('')}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-on-surface-variant transition-all hover:bg-white/10"
            >
              Clear Search
            </button>
          }
        />
      ) : !isLoading && !isError && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visibleNotes.map((note) => {
            const style = noteStyles[note.color] || noteStyles.primary;

            return (
              <article
                key={note.id}
                className={`group relative min-h-[168px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.012)_100%)] shadow-[0_16px_40px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(0,0,0,0.26)] ${style.border}`}
              >
                <div className={`h-1 ${style.accent}`} />
                <div className={`absolute -right-12 -top-14 h-28 w-28 rounded-full blur-3xl transition-colors duration-500 ${style.glow}`} />
                <div className="relative flex h-full min-h-[164px] cursor-pointer flex-col p-4" onClick={() => openEdit(note)}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${style.chip}`}>
                      <StickyNote className="h-3 w-3" />
                      Note
                    </span>
                    <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <button
                        onClick={(e) => togglePin(note, e)}
                        className={`rounded-lg p-1.5 transition-all hover:bg-white/[0.08] ${
                          note.pinned ? style.icon : 'text-on-surface-variant/40 hover:text-on-surface-variant'
                        }`}
                        title={note.pinned ? 'Unpin' : 'Pin'}
                        aria-label={note.pinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openEdit(note);
                        }}
                        className="rounded-lg p-1.5 transition-all hover:bg-white/[0.08]"
                        aria-label={`Edit note "${note.text.slice(0, 20)}"`}
                      >
                        <Pencil className={`h-3.5 w-3.5 ${style.icon}`} />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(note.id);
                        }}
                        className="rounded-lg p-1.5 transition-all hover:bg-error/10"
                        aria-label={`Delete note "${note.text.slice(0, 20)}"`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-on-surface-variant/35 transition-colors hover:text-error" />
                      </button>
                    </div>
                  </div>

                  <p className="line-clamp-4 text-[15px] leading-6 text-on-surface-variant/90">{note.text}</p>

                  <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-outline">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatNoteDate(note.createdAt)}
                    </span>
                    <Pencil className={`h-3.5 w-3.5 opacity-45 ${style.icon}`} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editorMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onKeyDown={(event) => {
            if (event.key === 'Escape') closeEditor();
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') saveEditor();
          }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeEditor} />
          <div
            className={`glass-panel relative z-10 flex max-h-[min(720px,calc(100vh-48px))] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 shadow-[0_32px_100px_rgba(0,0,0,0.55)] ring-1 ${activeStyle.ring}`}
            role="dialog"
            aria-modal="true"
            aria-label={editorTitle}
          >
            <div className={`h-1 ${activeStyle.accent}`} />
            <div className="flex items-start justify-between gap-4 px-5 pt-5 md:px-6 md:pt-6">
              <div>
                <h2 className="text-xl font-bold text-on-surface">{editorTitle}</h2>
                <p className="mt-1 text-sm text-on-surface-variant/55">
                  {editorMode === 'edit' ? 'Focus, refine, and save this note.' : 'Capture the thought before it drifts away.'}
                </p>
              </div>
              <button onClick={closeEditor} className="rounded-full p-2 transition-all hover:bg-white/5" aria-label="Close editor">
                <X className="h-5 w-5 text-on-surface-variant" />
              </button>
            </div>

            <textarea
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              placeholder="Write your note..."
              className="mx-5 mt-4 min-h-[220px] flex-1 resize-none rounded-2xl border border-white/10 bg-surface-container-low/80 px-4 py-3 text-base leading-7 text-on-surface outline-none transition-all placeholder:text-outline/50 focus:border-primary/70 focus:shadow-[0_0_0_2px_rgba(214,186,255,0.1)] md:mx-6"
              autoFocus
            />

            <div className="border-t border-white/[0.07] px-5 py-3 md:px-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setDraftPinned((value) => !value)}
                    className={`rounded-xl p-2 transition-all hover:bg-white/[0.08] ${draftPinned ? activeStyle.chip : 'text-on-surface-variant/60'}`}
                    aria-label={draftPinned ? 'Unpin note' : 'Pin note'}
                  >
                    <Pin className="h-4 w-4" />
                  </button>
                  <button className="rounded-xl p-2 text-on-surface-variant/60 transition-all hover:bg-white/[0.08] hover:text-on-surface" aria-label="Add reminder">
                    <Bell className="h-4 w-4" />
                  </button>
                  <button className="rounded-xl p-2 text-on-surface-variant/60 transition-all hover:bg-white/[0.08] hover:text-on-surface" aria-label="Archive note">
                    <Archive className="h-4 w-4" />
                  </button>
                  <button
                    onClick={duplicateDraft}
                    disabled={!draftText.trim() || createMutation.isPending}
                    className="rounded-xl p-2 text-on-surface-variant/60 transition-all hover:bg-white/[0.08] hover:text-on-surface disabled:opacity-35"
                    aria-label="Duplicate note"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {editorMode === 'edit' && (
                    <button
                      onClick={deleteActiveNote}
                      disabled={deleteMutation.isPending}
                      className="rounded-xl p-2 text-on-surface-variant/60 transition-all hover:bg-error/10 hover:text-error disabled:opacity-50"
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-1.5" aria-label="Note color">
                    <Palette className="mr-1 h-4 w-4 text-on-surface-variant/50" />
                    {noteColors.map((color) => {
                      const colorStyle = noteStyles[color];
                      const isSelected = draftColor === color;

                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setDraftColor(color)}
                          className={`h-6 w-6 rounded-full border border-white/15 ${colorStyle.accent} ${isSelected ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-surface-container-low' : ''}`}
                          aria-label={`Use ${color} color`}
                        />
                      );
                    })}
                  </div>
                  <span className="px-1 text-xs font-medium text-outline">{draftText.trim().length} chars</span>
                  <button
                    onClick={closeEditor}
                    type="button"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-on-surface-variant transition-all hover:bg-white/10"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={saveEditor}
                    disabled={!draftText.trim() || createMutation.isPending || updateMutation.isPending}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:saturate-150 disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {editorMode === 'edit' ? 'Save' : 'Create'}
                  </button>
                </div>
              </div>
              <div className="mt-2 text-right text-[11px] font-medium text-outline">
                {editorMode === 'edit' ? 'Editing existing note' : 'Draft note'}
              </div>
            </div>
          </div>
        </div>
      )}
    </SectionShell>
  );
}
