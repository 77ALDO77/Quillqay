'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPage, updatePage, Block } from '@/lib/api';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Terminal, FolderOpen, Edit, Bell, LogOut, Menu, X,
  ArrowLeft, CheckCircle, Loader2, AlertCircle,
} from 'lucide-react';

const BlockEditor = dynamic(() => import('@/components/BlockEditor'), {
  ssr: false,
  loading: () => (
    <div className="bg-surface-container-lowest rounded-2xl p-8 border border-white/10 min-h-[500px] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  ),
});

export default function NoteEditorPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['note', id],
    queryFn: () => getPage(id),
    staleTime: Infinity,
  });

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

  const handleEditorChange = useCallback(
    (blocks: Block[]) => {
      setSaveStatus('saving');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (page) {
          saveMutation.mutate({ title: page.title, blocks });
        }
      }, 2000);
    },
    [page, saveMutation]
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveMutation.mutate({ title: e.target.value || 'Untitled', blocks: page?.blocks || [] });
      }, 1000);
    },
    [page, saveMutation]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1c1b1d_0%,#131315_100%)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (isError || !page) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1c1b1d_0%,#131315_100%)] flex flex-col items-center justify-center gap-4 font-display">
        <div className="glass-panel rounded-3xl border border-white/10 p-12 text-center max-w-sm mx-4">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h1 className="text-xl font-bold text-on-surface mb-2">Note not found</h1>
          <p className="text-on-surface-variant/70 text-sm mb-6">This note may have been deleted or doesn&apos;t exist.</p>
          <Link
            href="/notes"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:saturate-150 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Notes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1c1b1d_0%,#131315_100%)] text-on-surface font-display">
      {/* Background Accents */}
      <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[30vw] h-[30vw] bg-secondary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* TopNavBar */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-4 md:px-6 py-3 bg-surface/60 backdrop-blur-lg rounded-xl mt-4 mx-4 border border-white/10 shadow-[0_0_15px_rgba(157,92,255,0.1)]">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors text-on-surface-variant"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/notes" className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-on-surface-variant" title="Back to notes">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link href="/notes" className="flex items-center gap-2.5">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-primary-container rounded-lg flex items-center justify-center glow-accent">
              <Terminal className="w-3.5 h-3.5 md:w-4 md:h-4 text-on-primary-container" />
            </div>
            <span className="text-lg md:text-xl font-bold tracking-tighter text-primary hidden sm:inline">Quillqay</span>
          </Link>
        </div>

        {/* Save Status */}
        <div className="flex items-center gap-2 text-sm">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-on-surface-variant text-xs md:text-sm">
              <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin text-primary" />
              <span className="hidden sm:inline">Saving...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-on-surface-variant text-xs md:text-sm">
              <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-secondary" />
              <span className="hidden sm:inline">Saved</span>
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-error text-xs md:text-sm">
              <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Error saving</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button className="p-2 rounded-full hover:bg-white/5 transition-all">
            <Bell className="w-4 md:w-5 h-4 md:h-5 text-on-surface-variant" />
          </button>
          <Link href="/login" className="p-2 rounded-full hover:bg-white/5 transition-all">
            <LogOut className="w-4 md:w-5 h-4 md:h-5 text-on-surface-variant" />
          </Link>
          <div className="h-7 w-7 md:h-8 md:w-8 rounded-full border border-primary/40 p-0.5">
            <div className="h-full w-full rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
              U
            </div>
          </div>
        </div>
      </header>

      <div className="flex gap-6 mt-6 min-h-[calc(100vh-140px)] relative z-10">
        {/* Sidebar Overlay (mobile) */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-30" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          </div>
        )}

        {/* SideNavBar */}
        <nav
          className={`fixed left-0 top-20 bottom-4 w-64 flex flex-col z-40 bg-surface/40 backdrop-blur-xl text-sm font-medium rounded-2xl m-4 border border-white/10 shadow-2xl overflow-hidden transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)]'
          } md:translate-x-0 md:flex`}
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center glow-accent">
                <Terminal className="w-5 h-5 text-on-primary-container" />
              </div>
              <div>
                <div className="text-on-surface font-bold">Quillqay</div>
                <div className="text-[10px] text-on-surface-variant/60 tracking-widest uppercase">Dashboard</div>
              </div>
            </div>
            <div className="space-y-2">
              <Link
                href="/projects"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant opacity-70 hover:bg-white/5 hover:opacity-100 transition-all"
                onClick={() => setSidebarOpen(false)}
              >
                <FolderOpen className="w-5 h-5" />
                <span>Projects</span>
              </Link>
              <Link
                href="/notes"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-primary bg-primary/10 transition-all"
                onClick={() => setSidebarOpen(false)}
              >
                <Edit className="w-5 h-5" />
                <span>Notes</span>
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant opacity-70 hover:bg-white/5 hover:opacity-100 transition-all"
                onClick={() => setSidebarOpen(false)}
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Editor Area */}
        <main className="flex-1 md:ml-[280px] lg:ml-[280px] mr-4">
          <div className="glass-panel rounded-3xl min-h-full border border-white/10 shadow-2xl flex flex-col p-6 md:p-8">
            {/* Title Input */}
            <div className="mb-6 md:mb-8">
              <input
                ref={titleInputRef}
                type="text"
                defaultValue={page.title}
                className="w-full bg-transparent text-2xl md:text-3xl font-bold tracking-tighter text-on-surface placeholder:text-outline/40 focus:outline-none border-b-2 border-transparent focus:border-primary transition-colors pb-2"
                placeholder="Note Title"
                onChange={handleTitleChange}
              />
            </div>

            {/* Editor */}
            <div className="flex-1">
              <BlockEditor
                initialData={page.blocks}
                onChange={handleEditorChange}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
