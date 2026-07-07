'use client';

import { useState, ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import {
  Terminal, Bell, LogOut, ArrowLeft,
  StickyNote, FileText, GitBranch, Columns3,
} from 'lucide-react';
const sidebarLinks = [
  { href: 'notes', label: 'Notes', icon: StickyNote },
  { href: 'documents', label: 'Documents', icon: FileText },
  { href: 'diagrams', label: 'Diagrams', icon: GitBranch },
  { href: 'canvas', label: 'Canvas', icon: Columns3 },
];

const NAVBAR_BG = { background: 'linear-gradient(135deg, rgba(28,27,29,0.9) 0%, rgba(20,20,22,0.95) 100%)' } as const;
const SIDEBAR_BG = { background: 'linear-gradient(135deg, rgba(28,27,29,0.95) 0%, rgba(20,20,22,0.98) 100%)' } as const;
const SIDEBAR_INSET = { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' } as const;

export default function ProjectLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const id = params.id as string;
  const [mounted, setMounted] = useState(false);
  const isDbDiagram = pathname.includes('/diagrams/db/');
  const isFlowchart = pathname.includes('/diagrams/flowchart/');
  const isWhiteboard = pathname.includes('/diagrams/whiteboard/');
  const isDiagramEditor = isDbDiagram || isFlowchart || isWhiteboard;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, [id]);

  const currentSection = sidebarLinks.find((link) => pathname.includes(`/${link.href}`))?.href || 'notes';

  return (
    <div className="relative h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#1c1b1d_0%,#131315_100%)] text-on-surface font-display">
      <div className="fixed top-[-10%] left-[10%] w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[30vw] h-[30vw] bg-secondary/3 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* ============ FLOATING NAVBAR ============ */}
      <header className="fixed left-4 right-4 top-4 z-50 flex items-center justify-between rounded-2xl border border-white/[0.12] px-4 py-3 shadow-[0_24px_50px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-2xl md:px-6" style={NAVBAR_BG}>
        <div className="absolute -inset-4 bg-primary/[0.04] rounded-[20px] blur-2xl pointer-events-none -z-10" />
        <div className="flex items-center gap-3">
          <Link
            href={isDiagramEditor ? `/projects/${id}/diagrams` : '/projects'}
            className="p-2 rounded-xl hover:bg-white/[0.06] transition-all text-on-surface-variant/60 hover:text-on-surface-variant"
            aria-label={isDiagramEditor ? 'Back to diagrams' : 'Back to projects'}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary-container/80 rounded-lg flex items-center justify-center glow-accent">
              <Terminal className="w-3.5 h-3.5 text-on-primary-container" />
            </div>
            <span className="text-sm font-bold tracking-tight text-on-surface hidden sm:inline">
              {id.slice(0, 8)}...
            </span>
          </div>
        </div>

        <span className="text-xs text-on-surface-variant/50 font-medium uppercase tracking-wider">
          {isDbDiagram ? 'Database Schema' : isFlowchart ? 'Flowchart' : isWhiteboard ? 'Whiteboard' : (sidebarLinks.find((l) => l.href === currentSection)?.label)}
        </span>

        <div className="flex items-center gap-2 md:gap-4">
          <button className="p-2 rounded-full hover:bg-white/5 transition-all" aria-label="Notifications">
            <Bell className="w-4 md:w-5 h-4 md:h-5 text-on-surface-variant/50" />
          </button>
          <div className="h-7 w-7 md:h-8 md:w-8 rounded-full border border-primary/30 p-0.5">
            <div className="h-full w-full rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary/70">U</div>
          </div>
        </div>
      </header>

      {isDiagramEditor ? (
        <>
          {/* ============ CONTENT AREA (full width, page renders sidebar) ============ */}
          <div className="fixed inset-x-0 bottom-0 top-[84px] flex flex-col overflow-hidden">
            <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 pb-4 md:p-5">
              {children}
            </main>
          </div>
        </>
      ) : (
        <>
          {/* ============ FLOATING SIDEBAR ============ */}
          <aside
            className={`
              fixed z-40
              top-[104px] bottom-5 left-4
              w-[240px] lg:w-[260px]
              flex flex-col
              rounded-3xl
              border border-white/[0.12]
              shadow-[0_24px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)_inset]
              backdrop-blur-2xl
              transition-all duration-700 ease-out
              ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}
            `}
            style={SIDEBAR_BG}
          >
            <div className="absolute -inset-8 bg-primary/[0.04] rounded-[40px] blur-3xl pointer-events-none -z-10" />
            <div className="absolute inset-0 rounded-3xl pointer-events-none" style={SIDEBAR_INSET} />

            <div className="p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 bg-primary-container/80 rounded-xl flex items-center justify-center glow-accent">
                  <Terminal className="w-4 h-4 text-on-primary-container" />
                </div>
                <div>
                  <div className="text-xs font-bold text-on-surface">Project</div>
                  <div className="text-[10px] text-on-surface-variant/40 truncate max-w-[140px]">{id}</div>
                </div>
              </div>

              <nav aria-label="Project sections" className="space-y-1">
                {sidebarLinks.map((link, i) => {
                  const isActive = currentSection === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={`/projects/${id}/${link.href}`}
                      className={`
                        flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-500 ease-out
                        ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
                        ${isActive
                          ? 'text-primary bg-primary/[0.1] scale-[1.02]'
                          : 'text-on-surface-variant/60 hover:bg-white/[0.04] hover:text-on-surface-variant'
                        }
                      `}
                      style={{ transitionDelay: `${200 + i * 60}ms` }}
                    >
                      <link.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-primary' : ''}`} />
                      <span>{link.label}</span>
                      {isActive && (
                        <div className="ml-auto w-1 h-4 rounded-full bg-primary shadow-[0_0_8px_rgba(214,186,255,0.5)]" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="mt-auto p-5 border-t border-white/[0.06]">
                <Link
                href="/login"
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl
                  text-on-surface-variant/40 hover:bg-white/[0.04] hover:text-on-surface-variant/70
                  transition-all duration-500 ease-out text-xs
                  ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
                `}
                style={{ transitionDelay: '600ms' }}
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </Link>
            </div>
          </aside>

          {/* ============ CONTENT AREA (pushed by sidebar) ============ */}
          <div className="fixed inset-x-0 bottom-0 top-[84px] flex flex-col overflow-hidden md:ml-[256px] lg:ml-[276px]">
            <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 pb-5 md:p-5">
              {children}
            </main>
          </div>
        </>
      )}
    </div>
  );
}
