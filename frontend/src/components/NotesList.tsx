'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPages, Page } from '@/lib/api';
import { Loader2, AlertCircle, FileText, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function NotesList() {
  const { data: notes, isLoading, isError, error } = useQuery<Page[]>({
    queryKey: ['notes'],
    queryFn: fetchPages,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="w-10 h-10 text-error" />
        <p className="text-on-surface-variant text-sm">{error instanceof Error ? error.message : 'Failed to load notes'}</p>
        <p className="text-outline text-xs">Make sure the backend is running</p>
      </div>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="w-16 h-16 text-outline-variant/30 mb-6" />
        <h3 className="text-lg font-bold text-on-surface mb-2">No notes yet</h3>
        <p className="text-on-surface-variant/60 text-sm max-w-sm mb-6">
          Create your first note to start writing. Your ideas deserve a beautiful home.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 custom-scrollbar">
      {notes.map((note) => (
        <Link key={note.id} href={`/notes/${note.id}`}>
          <div className="glass-panel group relative overflow-hidden rounded-2xl border border-white/10 p-6 flex flex-col h-full hover:border-primary/30 transition-all duration-300 cursor-pointer">
            {/* Background Glow */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl transition-all duration-500 group-hover:bg-primary/15" />

            {/* Title */}
            <h3 className="text-lg font-bold tracking-tight text-on-surface mb-3 group-hover:text-primary transition-colors">
              {note.title}
            </h3>

            {/* Preview */}
            <p className="text-sm text-on-surface-variant/70 mb-6 leading-relaxed line-clamp-2">
              {note.blocks ? `${note.blocks.length} blocks` : 'No content'}
            </p>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                {note.updated_at ? (
                  <>
                    <Clock className="w-3 h-3 text-outline" />
                    <span className="text-[10px] text-outline font-bold">
                      {new Date(note.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] text-outline font-bold">New</span>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-on-surface-variant/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
