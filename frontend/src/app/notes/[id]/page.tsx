'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPage, updatePage, Block } from '@/lib/api';
// import BlockEditor from '@/components/BlockEditor'; <-- Static import removed
import { Loader2, Save, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled
const BlockEditor = dynamic(() => import('@/components/BlockEditor'), {
    ssr: false,
    loading: () => <div className="text-gray-500 p-8">Initializing Editor...</div>
});

export default function NotePage() {
    const params = useParams();
    const id = params.id as string;
    const queryClient = useQueryClient();
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch Note Data
    const { data: page, isLoading, isError } = useQuery({
        queryKey: ['note', id],
        queryFn: () => getPage(id),
        staleTime: Infinity, // Don't refetch automatically while editing to avoid cursor jumps
    });

    // Save Mutation
    const saveMutation = useMutation({
        mutationFn: (vars: { title: string; blocks: Block[] }) =>
            updatePage(id, vars.title, vars.blocks),
        onMutate: () => setSaveStatus('saving'),
        onSuccess: () => {
            setSaveStatus('saved');
            queryClient.invalidateQueries({ queryKey: ['note', id] });
        },
        onError: () => setSaveStatus('error'),
    });

    // Debounced Auto-save
    const handleEditorChange = (blocks: Block[]) => {
        setSaveStatus('saving');

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            if (page) {
                saveMutation.mutate({ title: page.title, blocks });
            }
        }, 2000); // Save after 2 seconds of inactivity
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
            </div>
        );
    }

    if (isError || !page) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-black text-white gap-4">
                <h1 className="text-2xl text-red-500">Error loading note</h1>
                <Link href="/" className="underline text-gray-400 hover:text-white">Go back home</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6">
            {/* Header */}
            <header className="flex items-center justify-between mb-8 max-w-4xl mx-auto">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-400" />
                    </Link>
                    <input
                        type="text"
                        defaultValue={page.title}
                        className="bg-transparent text-3xl font-bold focus:outline-none focus:border-b border-gray-700 w-full"
                        placeholder="Note Title"
                        onChange={(e) => {
                            // Also trigger save on title change
                            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                            saveTimeoutRef.current = setTimeout(() => {
                                saveMutation.mutate({ title: e.target.value, blocks: page.blocks || [] });
                            }, 1000);
                        }}
                    />
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-400">
                    {saveStatus === 'saving' && (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving...</span>
                        </>
                    )}
                    {saveStatus === 'saved' && (
                        <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Saved</span>
                        </>
                    )}
                    {saveStatus === 'error' && <span className="text-red-500">Error saving</span>}
                </div>
            </header>

            {/* Editor Area */}
            <main className="max-w-4xl mx-auto">
                <BlockEditor
                    initialData={page.blocks}
                    onChange={handleEditorChange}
                />
            </main>
        </div>
    );
}
