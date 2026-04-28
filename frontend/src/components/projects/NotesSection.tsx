'use client';

import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';

interface Note {
  id: string;
  text: string;
  color: string;
  createdAt: string;
}

const noteColors = ['primary', 'secondary', 'tertiary'];

const demoNotes: Note[] = [
  { id: '1', text: 'Set up CI/CD pipeline with Docker and GitHub Actions', color: 'primary', createdAt: 'Today' },
  { id: '2', text: 'Review API rate limiting strategy for v2', color: 'secondary', createdAt: 'Yesterday' },
  { id: '3', text: 'Add WebSocket real-time sync between clients', color: 'tertiary', createdAt: '2 days ago' },
  { id: '4', text: 'Design database schema for user permissions', color: 'primary', createdAt: '3 days ago' },
  { id: '5', text: 'Write integration tests for auth flow', color: 'secondary', createdAt: 'Last week' },
  { id: '6', text: 'Update README with setup instructions', color: 'tertiary', createdAt: 'Last week' },
];

export default function NotesSection() {
  const [notes, setNotes] = useState<Note[]>(demoNotes);
  const [showNew, setShowNew] = useState(false);
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleCreate = () => {
    if (!newText.trim()) return;
    const note: Note = {
      id: `note-${Date.now()}`,
      text: newText.trim(),
      color: noteColors[Math.floor(Math.random() * noteColors.length)],
      createdAt: 'Just now',
    };
    setNotes([note, ...notes]);
    setNewText('');
    setShowNew(false);
  };

  const handleUpdate = (id: string) => {
    if (!editText.trim()) return;
    setNotes(notes.map((n) => (n.id === id ? { ...n, text: editText.trim() } : n)));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  return (
    <div className="glass-panel rounded-3xl border border-white/10 shadow-2xl p-6 md:p-8 min-h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-on-surface mb-2">Notes</h1>
          <p className="text-on-surface-variant/70 text-sm">Quick ideas, todos, and reminders for this project.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-on-primary shadow-lg shadow-primary/20 hover:saturate-150 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <StickyNoteIcon className="w-16 h-16 text-outline-variant/30 mb-6" />
          <h3 className="text-lg font-bold text-on-surface mb-2">No notes yet</h3>
          <p className="text-on-surface-variant/60 text-sm max-w-sm mb-6">
            Jot down quick thoughts, reminders, or tasks for this project.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`group relative rounded-2xl border border-white/10 overflow-hidden hover:border-${note.color}/30 transition-all duration-300`}
            >
              {/* Color top bar */}
              <div className={`h-1.5 bg-${note.color}`} />

              {editingId === note.id ? (
                <div className="p-4">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-surface-container-low border border-white/10 rounded-xl p-3 text-sm text-on-surface placeholder:text-outline/50 focus:border-primary outline-none resize-none min-h-[100px]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleUpdate(note.id);
                      }
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleUpdate(note.id)}
                      className="flex-1 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:saturate-150 transition-all"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 text-on-surface-variant text-xs hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => {
                    setEditingId(note.id);
                    setEditText(note.text);
                  }}
                >
                  <p className="text-sm text-on-surface-variant/90 leading-relaxed line-clamp-4">{note.text}</p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                    <span className="text-[10px] text-outline font-bold">{note.createdAt}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(note.id);
                      }}
                      className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-error/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-on-surface-variant/40 hover:text-error transition-colors" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Note Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="glass-panel relative z-10 w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-tight">New Note</h2>
              <button onClick={() => setShowNew(false)} className="p-2 rounded-full hover:bg-white/5 transition-all">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Write your note..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-outline/50 focus:border-primary outline-none resize-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreate();
                }
              }}
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
                disabled={!newText.trim()}
                className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:saturate-150 transition-all disabled:opacity-50"
              >
                Create Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StickyNoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M15 3v6h6" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  );
}
