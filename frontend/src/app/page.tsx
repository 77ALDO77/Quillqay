'use client';

import NotesList from '@/components/NotesList';
import { Plus, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPage } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () => createPage('Untitled Note'),
    onSuccess: (newPage) => {
      // Invalidate list to refresh
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      // Navigate to the new note
      router.push(`/notes/${newPage.id}`);
    },
  });

  return (
    <main className="min-h-screen bg-black text-white p-4 pb-20">
      <header className="flex justify-between items-center mb-8 pt-4 px-2 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-white bg-clip-text text-transparent">
            Qillqay
          </h1>
          <p className="text-gray-500 text-sm">Your thoughts, organized.</p>
        </div>

        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-full transition-colors font-medium disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          <span>New Note</span>
        </button>
      </header>

      <div className="max-w-6xl mx-auto">
        <NotesList />
      </div>
    </main>
  );
}
