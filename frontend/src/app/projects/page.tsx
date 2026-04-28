'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Terminal, FolderOpen, FileText, Edit, Bell, Search, LogOut,
  Plus, Clock, Users, ArrowRight, Trash2, MoreHorizontal, X, Check,
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
    description: 'Quarterly planning, feature prioritization, and release timeline tracking for Q2-Q4.',
    pages: 12,
    updatedAt: 'Today, 2:30 PM',
    color: 'primary',
    tags: ['Planning', 'Strategy'],
  },
  {
    id: 'proj-2',
    title: 'API Documentation',
    description: 'REST and WebSocket endpoint specs, auth flows, rate limiting, and SDK examples.',
    pages: 24,
    updatedAt: 'Yesterday, 6:15 PM',
    color: 'secondary',
    tags: ['API', 'Docs'],
  },
  {
    id: 'proj-3',
    title: 'Design System',
    description: 'Liquid Glass tokens, typography scale, component variants, and usage guidelines.',
    pages: 8,
    updatedAt: '2 days ago',
    color: 'tertiary',
    tags: ['Design', 'UI/UX'],
  },
  {
    id: 'proj-4',
    title: 'Onboarding Flows',
    description: 'User journey maps, signup funnels, email templates, and A/B test results.',
    pages: 16,
    updatedAt: '3 days ago',
    color: 'secondary',
    tags: ['UX', 'Growth'],
  },
  {
    id: 'proj-5',
    title: 'Database Schema',
    description: 'Entity relationships, migration scripts, indexing strategy, and backup procedures.',
    pages: 7,
    updatedAt: 'Last week',
    color: 'primary',
    tags: ['Backend', 'Data'],
  },
  {
    id: 'proj-6',
    title: 'Meeting Notes',
    description: 'Standups, sprint retrospectives, 1:1s, and architecture decision records.',
    pages: 43,
    updatedAt: 'Last week',
    color: 'tertiary',
    tags: ['Notes', 'Meetings'],
  },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<DemoProject[]>(initialProjects);
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({ title: '', description: '', tags: '' });
  const [filter, setFilter] = useState<'all' | 'recent' | 'favorites'>('all');

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateProject = () => {
    if (!newProject.title.trim()) return;
    const project: DemoProject = {
      id: `proj-${Date.now()}`,
      title: newProject.title,
      description: newProject.description || 'No description yet.',
      pages: 1,
      updatedAt: 'Just now',
      color: ['primary', 'secondary', 'tertiary'][Math.floor(Math.random() * 3)],
      tags: newProject.tags ? newProject.tags.split(',').map((t) => t.trim()) : [],
    };
    setProjects([project, ...projects]);
    setNewProject({ title: '', description: '', tags: '' });
    setShowNewModal(false);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
    setShowDeleteConfirm(null);
  };

  const recentProjects = [...projects].sort(() => Math.random() - 0.5).slice(0, 3);
  const displayProjects = filter === 'recent'
    ? recentProjects
    : filter === 'favorites'
    ? projects.filter((_, i) => i % 2 === 0)
    : filteredProjects;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1c1b1d_0%,#131315_100%)] text-on-surface font-display">
      {/* Background Accents */}
      <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[30vw] h-[30vw] bg-secondary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* TopNavBar */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-6 py-3 bg-surface/60 backdrop-blur-lg tracking-tight rounded-xl mt-4 mx-4 border border-white/10 shadow-[0_0_15px_rgba(157,92,255,0.1)]">
        <Link href="/projects" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center glow-accent">
            <Terminal className="w-4 h-4 text-on-primary-container" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-primary">Quillqay</span>
        </Link>
        <div className="hidden md:flex items-center gap-1 bg-surface-container/50 px-3 py-1.5 rounded-lg border border-white/5">
          <Search className="w-4 h-4 text-on-surface-variant" />
          <input
            className="bg-transparent border-none focus:ring-0 text-sm w-64 placeholder:text-outline/50 text-on-surface outline-none"
            placeholder="Search projects..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-outline">CMD + K</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-white/5 transition-all">
            <Bell className="w-5 h-5 text-on-surface-variant" />
          </button>
          <Link href="/login" className="p-2 rounded-full hover:bg-white/5 transition-all">
            <LogOut className="w-5 h-5 text-on-surface-variant" />
          </Link>
          <div className="h-8 w-8 rounded-full border border-primary/40 p-0.5">
            <div className="h-full w-full rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
              U
            </div>
          </div>
        </div>
      </header>

      <div className="flex gap-6 mt-6 min-h-[calc(100vh-140px)] relative z-10">
        {/* SideNavBar */}
        <nav className="fixed left-0 top-20 bottom-4 w-64 flex flex-col z-40 bg-surface/40 backdrop-blur-xl text-sm font-medium rounded-2xl m-4 border border-white/10 shadow-2xl overflow-hidden hidden md:flex">
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
              <Link href="/projects" className="flex items-center gap-3 px-4 py-3 rounded-xl text-primary bg-primary/10 transition-all">
                <FolderOpen className="w-5 h-5" />
                <span>Projects</span>
                <span className="ml-auto text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{projects.length}</span>
              </Link>
              <Link href="/ideas" className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant opacity-70 hover:bg-white/5 hover:opacity-100 transition-all">
                <Edit className="w-5 h-5" />
                <span>Notes</span>
              </Link>
              <Link href="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant opacity-70 hover:bg-white/5 hover:opacity-100 transition-all">
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 md:ml-[280px] lg:ml-[280px] mr-4">
          <div className="glass-panel rounded-3xl min-h-full border border-white/10 shadow-2xl flex flex-col p-8">
            {/* Content Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
              <div>
                <h1 className="text-4xl font-bold text-on-surface tracking-tighter mb-2">Projects</h1>
                <p className="text-on-surface-variant/70 max-w-md">Manage your knowledge base. Each project is a collection of interconnected notes and documents.</p>
              </div>
              <div className="flex items-center gap-3 bg-surface-container-low p-1.5 rounded-2xl border border-white/5">
                <button
                  onClick={() => setShowNewModal(true)}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-primary text-on-primary shadow-lg shadow-primary/20 hover:saturate-150 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
                <button
                  onClick={() => setFilter(filter === 'all' ? 'recent' : filter === 'recent' ? 'favorites' : 'all')}
                  className="px-5 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-white/5 transition-all"
                >
                  {filter === 'all' ? 'Recent' : filter === 'recent' ? 'Favorites' : 'All'}
                </button>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg border border-white/5 text-xs text-on-surface-variant">
                <span className="font-medium">{filteredProjects.length}</span> projects
              </div>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="flex items-center gap-1 px-3 py-1 bg-white/5 rounded-full text-[10px] text-on-surface-variant uppercase tracking-widest font-bold hover:bg-white/10 transition-all"
                >
                  <X className="w-3 h-3" />
                  Clear search
                </button>
              )}
              <div className="h-4 w-px bg-white/10 mx-2" />
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] rounded-full border border-primary/20 uppercase tracking-widest font-bold">Demo Mode</span>
            </div>

            {/* Projects Grid */}
            {displayProjects.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                <FolderOpen className="w-16 h-16 text-outline-variant/30 mb-6" />
                <h3 className="text-xl font-bold text-on-surface mb-2">No projects found</h3>
                <p className="text-on-surface-variant/60 max-w-sm mb-6">
                  {search ? 'No projects match your search. Try different keywords.' : 'Create your first project to start organizing your knowledge.'}
                </p>
                {search ? (
                  <button onClick={() => setSearch('')} className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant font-medium text-sm hover:bg-white/10 transition-all">
                    Clear search
                  </button>
                ) : (
                  <button onClick={() => setShowNewModal(true)} className="px-6 py-2 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:saturate-150 transition-all flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Project
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 custom-scrollbar">
                {displayProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`glass-panel group relative overflow-hidden rounded-[24px] border border-white/10 p-6 flex flex-col hover:border-${project.color}/30 transition-all duration-300`}
                  >
                    {/* Background Glow */}
                    <div className={`absolute -top-12 -right-12 w-32 h-32 bg-${project.color}/5 rounded-full blur-3xl transition-all duration-500 group-hover:bg-${project.color}/15`} />

                    {/* Tags */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-2">
                        {project.tags.map((tag) => (
                          <span key={tag} className="bg-surface-container px-2 py-1 rounded text-[10px] font-bold text-outline uppercase tracking-tighter">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                        <button
                          onClick={() => setShowDeleteConfirm(project.id)}
                          className="p-1.5 rounded-lg hover:bg-error/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-on-surface-variant/40 hover:text-error transition-colors" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-on-surface-variant/40" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl font-bold mb-3 tracking-tight group-hover:text-on-surface transition-colors">{project.title}</h3>
                    <p className="text-sm text-on-surface-variant/80 mb-6 leading-relaxed">{project.description}</p>

                    {/* Stats */}
                    <div className="mt-auto flex items-center gap-4 text-[10px] text-outline font-bold mb-4">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full bg-${project.color}/10 text-${project.color}`}>
                        <FileText className="w-3 h-3" />
                        {project.pages} pages
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {project.updatedAt}
                      </span>
                    </div>

                    {/* Open Button */}
                    <Link
                      href={`/notes`}
                      className={`group/btn flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-${project.color}/20 bg-${project.color}/5 text-${project.color} font-medium text-sm hover:bg-${project.color}/10 transition-all`}
                    >
                      Open Project
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNewModal(false)} />
          <div className="glass-panel relative z-10 w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight">New Project</h2>
              <button onClick={() => setShowNewModal(false)} className="p-2 rounded-full hover:bg-white/5 transition-all">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-outline uppercase tracking-widest font-bold mb-1.5 block">Title</label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="e.g. Product Roadmap"
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-outline/50 focus:border-primary focus:ring-0 focus:shadow-[0_0_0_2px_rgba(214,186,255,0.1)] outline-none transition-all"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                />
              </div>
              <div>
                <label className="text-[10px] text-outline uppercase tracking-widest font-bold mb-1.5 block">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="What's this project about?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-outline/50 focus:border-primary focus:ring-0 focus:shadow-[0_0_0_2px_rgba(214,186,255,0.1)] outline-none transition-all resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-outline uppercase tracking-widest font-bold mb-1.5 block">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newProject.tags}
                  onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                  placeholder="e.g. Design, API, Planning"
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-outline/50 focus:border-primary focus:ring-0 focus:shadow-[0_0_0_2px_rgba(214,186,255,0.1)] outline-none transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant font-medium text-sm hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProject.title.trim()}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:saturate-150 transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 inline-block mr-1" />
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
          <div className="glass-panel relative z-10 w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl p-8 text-center">
            <div className="w-12 h-12 bg-error/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-error" />
            </div>
            <h2 className="text-lg font-bold tracking-tight mb-2">Delete project?</h2>
            <p className="text-sm text-on-surface-variant/70 mb-6">This action demos deletion. In production, the project and all its pages would be removed.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant font-medium text-sm hover:bg-white/10 transition-all"
              >
                Keep
              </button>
              <button
                onClick={() => handleDeleteProject(showDeleteConfirm)}
                className="flex-1 px-4 py-3 rounded-xl bg-error/10 border border-error/20 text-error font-bold text-sm hover:bg-error/20 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
