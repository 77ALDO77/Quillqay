'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Terminal, Bell, Search, LogOut,
  Plus, Clock, ArrowRight, Trash2, X, FileText,
} from 'lucide-react';

interface DemoProject {
  id: string;
  title: string;
  description: string;
  pages: number;
  updatedAt: string;
  color: string;
  tags: string[];
}

const initialProjects: DemoProject[] = [
  {
    id: 'proj-1',
    title: 'Product Roadmap 2026',
    description: 'Quarterly planning, feature prioritization, and release timeline tracking.',
    pages: 12,
    updatedAt: 'Today, 2:30 PM',
    color: 'primary',
    tags: ['Planning', 'Strategy'],
  },
  {
    id: 'proj-2',
    title: 'API Documentation',
    description: 'REST and WebSocket endpoint specs, auth flows, rate limiting.',
    pages: 24,
    updatedAt: 'Yesterday',
    color: 'secondary',
    tags: ['API', 'Docs'],
  },
  {
    id: 'proj-3',
    title: 'Design System',
    description: 'Liquid Glass tokens, typography, components, usage guidelines.',
    pages: 8,
    updatedAt: '2 days ago',
    color: 'tertiary',
    tags: ['Design', 'UI/UX'],
  },
  {
    id: 'proj-4',
    title: 'Onboarding Flows',
    description: 'User journey maps, signup funnels, email templates.',
    pages: 16,
    updatedAt: '3 days ago',
    color: 'secondary',
    tags: ['UX', 'Growth'],
  },
  {
    id: 'proj-5',
    title: 'Database Schema',
    description: 'Entity relationships, migrations, indexing strategy.',
    pages: 7,
    updatedAt: 'Last week',
    color: 'primary',
    tags: ['Backend', 'Data'],
  },
  {
    id: 'proj-6',
    title: 'Meeting Notes',
    description: 'Standups, retrospectives, 1:1s, architecture decisions.',
    pages: 43,
    updatedAt: 'Last week',
    color: 'tertiary',
    tags: ['Notes', 'Meetings'],
  },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<DemoProject[]>(initialProjects);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({ title: '', description: '', tags: '' });

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!newProject.title.trim()) return;
    const proj: DemoProject = {
      id: `proj-${Date.now()}`,
      title: newProject.title.trim(),
      description: newProject.description || 'No description yet.',
      pages: 0,
      updatedAt: 'Just now',
      color: ['primary', 'secondary', 'tertiary'][Math.floor(Math.random() * 3)],
      tags: newProject.tags ? newProject.tags.split(',').map((t) => t.trim()) : [],
    };
    setProjects([proj, ...projects]);
    setNewProject({ title: '', description: '', tags: '' });
    setShowNew(false);
  };

  const handleDelete = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
    setShowDelete(null);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1c1b1d_0%,#131315_100%)] text-on-surface font-display">
      {/* Background */}
      <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-primary/8 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[30vw] h-[30vw] bg-secondary/4 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-4 md:px-6 py-3 bg-surface/60 backdrop-blur-lg rounded-xl mt-4 mx-4 border border-white/10 shadow-[0_0_15px_rgba(157,92,255,0.1)]">
        <Link href="/projects" className="flex items-center gap-2.5">
          <div className="w-7 h-7 md:w-8 md:h-8 bg-primary-container rounded-lg flex items-center justify-center glow-accent">
            <Terminal className="w-3.5 h-3.5 md:w-4 md:h-4 text-on-primary-container" />
          </div>
          <span className="text-lg md:text-xl font-bold tracking-tighter text-primary">Quillqay</span>
        </Link>

        <div className="hidden md:flex items-center gap-1 bg-surface-container/50 px-3 py-1.5 rounded-lg border border-white/5">
          <Search className="w-4 h-4 text-on-surface-variant" />
          <input
            className="bg-transparent border-none focus:ring-0 text-sm w-56 placeholder:text-outline/50 text-on-surface outline-none"
            placeholder="Search projects..."
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
            <div className="h-full w-full rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">U</div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 pt-12 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-on-surface mb-3">Your Projects</h1>
            <p className="text-on-surface-variant/70 text-sm max-w-lg">
              Each project contains notes, documents, diagrams, and a kanban canvas to organize your work.
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-on-primary shadow-lg shadow-primary/20 hover:saturate-150 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Projects Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-16 h-16 text-outline-variant/30 mb-6" />
            <h3 className="text-xl font-bold text-on-surface mb-2">No projects found</h3>
            <p className="text-on-surface-variant/60 text-sm max-w-sm mb-6">
              {search ? 'No projects match your search.' : 'Create your first project to get started.'}
            </p>
            {search ? (
              <button onClick={() => setSearch('')} className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant font-medium text-sm hover:bg-white/10 transition-all">
                Clear search
              </button>
            ) : (
              <button onClick={() => setShowNew(true)} className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:saturate-150 transition-all flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((project) => (
              <div
                key={project.id}
                className={`glass-panel group relative overflow-hidden rounded-2xl border border-white/10 p-6 flex flex-col hover:border-${project.color}/30 transition-all duration-300`}
              >
                <div className={`absolute -top-12 -right-12 w-32 h-32 bg-${project.color}/5 rounded-full blur-3xl transition-all duration-500 group-hover:bg-${project.color}/12`} />

                {/* Tags + Delete */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {project.tags.map((tag) => (
                      <span key={tag} className="bg-surface-container px-2 py-0.5 rounded text-[10px] font-bold text-outline uppercase tracking-tighter">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDelete(project.id); }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-error/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-on-surface-variant/30 hover:text-error transition-colors" />
                  </button>
                </div>

                {/* Title + Desc */}
                <h3 className="text-xl font-bold tracking-tight text-on-surface mb-2">{project.title}</h3>
                <p className="text-sm text-on-surface-variant/70 mb-6 leading-relaxed line-clamp-2">{project.description}</p>

                {/* Meta */}
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <span className={`flex items-center gap-1 text-${project.color}`}>
                      <FileText className="w-3 h-3" />
                      {project.pages} pages
                    </span>
                    <span className="flex items-center gap-1 text-outline">
                      <Clock className="w-3 h-3" />
                      {project.updatedAt}
                    </span>
                  </div>
                  <Link
                    href={`/projects/${project.id}/notes`}
                    className={`flex items-center gap-1 text-xs font-bold text-${project.color} hover:underline`}
                  >
                    Open
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="glass-panel relative z-10 w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-tight">New Project</h2>
              <button onClick={() => setShowNew(false)} className="p-2 rounded-full hover:bg-white/5 transition-all">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                placeholder="Project name"
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-outline/50 focus:border-primary outline-none"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-outline/50 focus:border-primary outline-none resize-none"
              />
              <input
                type="text"
                value={newProject.tags}
                onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                placeholder="Tags: Design, API, Planning"
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-outline/50 focus:border-primary outline-none"
              />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowNew(false)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant font-medium text-sm hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={handleCreate} disabled={!newProject.title.trim()} className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:saturate-150 transition-all disabled:opacity-50">
                  <Plus className="w-4 h-4 inline mr-1" />Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDelete(null)} />
          <div className="glass-panel relative z-10 w-full max-w-xs rounded-3xl border border-white/10 shadow-2xl p-8 text-center">
            <Trash2 className="w-10 h-10 text-error mx-auto mb-3" />
            <h2 className="text-lg font-bold mb-2">Delete project?</h2>
            <p className="text-xs text-on-surface-variant/70 mb-6">This is a demo. In production, all data will be removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant font-medium text-sm hover:bg-white/10 transition-all">Keep</button>
              <button onClick={() => handleDelete(showDelete)} className="flex-1 py-2.5 rounded-xl bg-error/10 border border-error/20 text-error font-bold text-sm hover:bg-error/20 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
