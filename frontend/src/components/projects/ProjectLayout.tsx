'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import {
  Terminal, Bell, LogOut, ArrowLeft,
  StickyNote, FileText, GitBranch, Columns3,
} from 'lucide-react';

interface ProjectLayoutProps {
  children: ReactNode;
  projectTitle: string;
}

const sidebarLinks = [
  { href: 'notes', label: 'Notes', icon: StickyNote },
  { href: 'documents', label: 'Documents', icon: FileText },
  { href: 'diagrams', label: 'Diagrams', icon: GitBranch },
  { href: 'canvas', label: 'Canvas', icon: Columns3 },
];

export default function ProjectLayout({ children, projectTitle }: ProjectLayoutProps) {
  const params = useParams();
  const pathname = usePathname();
  const id = params.id as string;

  const currentSection = sidebarLinks.find((link) => pathname.includes(`/${link.href}`))?.href || 'notes';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1c1b1d_0%,#131315_100%)] text-on-surface font-display overflow-hidden">
      {/* Background Accents */}
      <div className="fixed top-[-10%] left-[15%] w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[30vw] h-[30vw] bg-secondary/3 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Sidebar */}
      <aside className="sidebar fixed left-0 top-0 bottom-0 w-[260px] lg:w-[280px] z-40 bg-surface/80 backdrop-blur-2xl border-r border-white/10 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <Link
              href="/projects"
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-on-surface-variant"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link href="/projects" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center glow-accent">
                <Terminal className="w-4 h-4 text-on-primary-container" />
              </div>
              <span className="text-lg font-bold tracking-tighter text-primary truncate max-w-[140px]">
                {projectTitle}
              </span>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = currentSection === link.href;
              return (
                <Link
                  key={link.href}
                  href={`/projects/${id}/${link.href}`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-on-surface-variant/70 hover:bg-white/5 hover:text-on-surface-variant'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  <span>{link.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-5 rounded-full bg-primary" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="mt-auto p-6 border-t border-white/5">
          <Link
            href="/login"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant/60 hover:bg-white/5 hover:text-on-surface-variant transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content - pushed by sidebar */}
      <div className="sidebar-content ml-0 lg:ml-[280px] md:ml-[260px] min-h-screen flex flex-col">
        {/* TopNavBar */}
        <header className="sticky top-0 z-30 flex justify-between items-center px-4 md:px-6 py-3 bg-surface/60 backdrop-blur-lg rounded-xl mt-4 mx-4 border border-white/10 shadow-[0_0_15px_rgba(157,92,255,0.1)]">
          <div className="flex items-center gap-3">
            <span className="text-sm text-on-surface-variant/70 font-medium">
              {sidebarLinks.find((l) => l.href === currentSection)?.label}
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2 rounded-full hover:bg-white/5 transition-all">
              <Bell className="w-4 md:w-5 h-4 md:h-5 text-on-surface-variant" />
            </button>
            <div className="h-7 w-7 md:h-8 md:w-8 rounded-full border border-primary/40 p-0.5">
              <div className="h-full w-full rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                U
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
