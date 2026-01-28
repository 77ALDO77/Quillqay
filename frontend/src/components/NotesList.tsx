'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchNotes, Note } from '@/lib/api';
import { Loader2, AlertCircle, FileText } from 'lucide-react';

export default function NotesList() {
    const { data: notes, isLoading, isError, error } = useQuery<Note[]>({
        queryKey: ['notes'],
        queryFn: fetchNotes,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-red-500 gap-2">
                <AlertCircle className="w-8 h-8" />
                <p>Error loading notes: {error instanceof Error ? error.message : 'Unknown error'}</p>
                <p className="text-sm text-gray-500">Make sure the backend is running!</p>
            </div>
        );
    }

    if (!notes || notes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
                <FileText className="w-12 h-12 opacity-20" />
                <p>No notes found. Create one!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
                <div key={note.id} className="bg-gray-900 border border-gray-800 p-4 rounded-lg hover:border-purple-500 transition-colors cursor-pointer group">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400">{note.title}</h3>
                    <p className="text-gray-400 line-clamp-3">{note.content}</p>
                    <div className="mt-4 text-xs text-gray-600">
                        {new Date(note.updated_at).toLocaleDateString()}
                    </div>
                </div>
            ))}
        </div>
    );
}
