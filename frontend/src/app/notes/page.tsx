'use client';

import { useState } from 'react';
import Link from 'next/link';
import NotesList from '@/components/NotesList';
import {
  Terminal, FolderOpen, FileText, Edit, Bell, Search, LogOut,
  Plus, Menu, X,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPage } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function NotesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: (title: string) => createPage(title),
    onSuccess: (newPage) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      router.push(`/notes/${newPage.id}`);
    },
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1c1b1d_0%,#131315_100%)] text-on-surface font-display">
      {/* Background Accents */}
      <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[30vw] h-[30vw] bg-secondary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* TopNavBar */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-4 md:px-6 py-3 bg-surface/60 backdrop-blur-lg tracking-tight rounded-xl mt-4 mx-4 border border-white/10 shadow-[0_0_15px_rgba(157,92,255,0.1)]">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors text-on-surface-variant"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/notes" className="flex items-center gap-2.5">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-primary-container rounded-lg flex items-center justify-center glow-accent">
              <Terminal className="w-3.5 h-3.5 md:w-4 md:h-4 text-on-primary-container" />
            </div>
            <span className="text-lg md:text-xl font-bold tracking-tighter text-primary">Quillqay</span>
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-1 bg-surface-container/50 px-3 py-1.5 rounded-lg border border-white/5">
          <Search className="w-4 h-4 text-on-surface-variant" />
          <input
            className="bg-transparent border-none focus:ring-0 text-sm w-64 placeholder:text-outline/50 text-on-surface outline-none"
            placeholder="Search notes..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-outline">CMD + K</span>
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

        {/* Main Content */}
        <main className="flex-1 md:ml-[280px] lg:ml-[280px] mr-4">
          <div className="glass-panel rounded-3xl min-h-full border border-white/10 shadow-2xl flex flex-col p-6 md:p-8">
            {/* Content Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-10">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tighter mb-2">Notes</h1>
                <p className="text-on-surface-variant/70 text-sm max-w-md">Your personal knowledge space. Write, edit, and organize your ideas.</p>
              </div>
              <button
                onClick={() => {
                  const title = prompt('Note title:');
                  if (title) createMutation.mutate(title);
                }}
                disabled={createMutation.isPending}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-on-primary shadow-lg shadow-primary/20 hover:saturate-150 transition-all flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                {createMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    New Note
                  </>
                )}
              </button>
            </div>

            {/* Notes Grid */}
            <NotesList />
          </div>
        </main>
      </div>
    </div>
  );
}
