'use client';

import { useCallback, useState } from 'react';
import {
  Archive,
  Bell,
  CalendarDays,
  Copy,
  Palette,
  Pencil,
  Pin,
  Plus,
  Search,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';
import SectionShell, { SectionShellAction } from './SectionShell';
import EmptyState from './EmptyState';

const noteColors = ['primary', 'secondary', 'tertiary'] as const;
type NoteColor = (typeof noteColors)[number];

interface Note {
  id: string;
  text: string;
  color: NoteColor;
  createdAt: string;
  pinned?: boolean;
}

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

const demoNotes: Note[] = [
  { id: '1', text: 'Set up CI/CD pipeline with Docker and GitHub Actions', color: 'primary', createdAt: 'Today', pinned: true },
  { id: '2', text: 'Review API rate limiting strategy for v2', color: 'secondary', createdAt: 'Yesterday' },
  { id: '3', text: 'Add WebSocket real-time sync between clients', color: 'tertiary', createdAt: '2 days ago' },
  { id: '4', text: 'Design database schema for user permissions', color: 'primary', createdAt: '3 days ago' },
  { id: '5', text: 'Write integration tests for auth flow', color: 'secondary', createdAt: 'Last week' },
  { id: '6', text: 'Update README with setup instructions', color: 'tertiary', createdAt: 'Last week' },
];

export default function NotesSection() {
  const [notes, setNotes] = useState<Note[]>(demoNotes);
  const [query, setQuery] = useState('');
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const [draftColor, setDraftColor] = useState<NoteColor>('primary');
  const [draftPinned, setDraftPinned] = useState(false);

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
      setNotes((current) =>
        current.map((note) =>
          note.id === activeNoteId
            ? { ...note, text, color: draftColor, pinned: draftPinned }
            : note
        )
      );
    } else {
      setNotes((current) => [
        {
          id: `note-${Date.now()}`,
          text,
          color: draftColor,
          createdAt: 'Just now',
          pinned: draftPinned,
        },
        ...current,
      ]);
    }

    closeEditor();
  }, [activeNoteId, closeEditor, draftColor, draftPinned, draftText, editorMode]);

  const deleteNote = useCallback((id: string) => {
    setNotes((current) => current.filter((note) => note.id !== id));
  }, []);

  const deleteActiveNote = useCallback(() => {
    if (!activeNoteId) return;
    deleteNote(activeNoteId);
    closeEditor();
  }, [activeNoteId, closeEditor, deleteNote]);

  const duplicateDraft = useCallback(() => {
    const text = draftText.trim();
    if (!text) return;

    setNotes((current) => [
      {
        id: `note-${Date.now()}`,
        text,
        color: draftColor,
        createdAt: 'Just now',
        pinned: draftPinned,
      },
      ...current,
    ]);
  }, [draftColor, draftPinned, draftText]);

  const visibleNotes = notes
    .filter((note) => note.text.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));

  const recentNotes = notes.filter((note) => ['Today', 'Yesterday', 'Just now'].includes(note.createdAt)).length;
  const activeStyle = noteStyles[draftColor];
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
            placeholder="Search notes"
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

      {notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Jot down quick thoughts, reminders, or tasks for this project."
          action={
            <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:saturate-150">
              <Plus className="h-4 w-4" />
              Create Note
            </button>
          }
        />
      ) : visibleNotes.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching notes"
          description="Try a different search term or create a fresh note."
          action={
            <button onClick={() => setQuery('')} className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-on-surface-variant transition-all hover:bg-white/10">
              Clear Search
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visibleNotes.map((note) => {
            const style = noteStyles[note.color];

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
                      {note.pinned && <Pin className={`h-3.5 w-3.5 ${style.icon}`} />}
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
                          deleteNote(note.id);
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
                      {note.createdAt}
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
                    disabled={!draftText.trim()}
                    className="rounded-xl p-2 text-on-surface-variant/60 transition-all hover:bg-white/[0.08] hover:text-on-surface disabled:opacity-35"
                    aria-label="Duplicate note"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {editorMode === 'edit' && (
                    <button
                      onClick={deleteActiveNote}
                      className="rounded-xl p-2 text-on-surface-variant/60 transition-all hover:bg-error/10 hover:text-error"
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
                          onClick={() => setDraftColor(color)}
                          className={`h-6 w-6 rounded-full border border-white/15 ${colorStyle.accent} ${isSelected ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-surface-container-low' : ''}`}
                          aria-label={`Use ${color} color`}
                        />
                      );
                    })}
                  </div>
                  <span className="px-1 text-xs font-medium text-outline">{draftText.trim().length} chars</span>
                  <button onClick={closeEditor} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-on-surface-variant transition-all hover:bg-white/10">
                    Close
                  </button>
                  <button
                    onClick={saveEditor}
                    disabled={!draftText.trim()}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:saturate-150 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
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
