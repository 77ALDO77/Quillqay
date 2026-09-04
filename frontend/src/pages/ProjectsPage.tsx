import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ViewTransitionLink from '@/components/ViewTransitionLink';
import { useAuth } from '@/features/auth';
import {
  listProjects,
  createProject,
  deleteProject,
  type Project,
} from '@/lib/api';
import {
  Terminal,
  Bell,
  Search,
  LogOut,
  Plus,
  Clock,
  ArrowRight,
  Trash2,
  X,
  FileText,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffHours = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    tags: '',
    color: 'primary',
  });

  const {
    data: projects = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: listProjects,
  });

  const createMutation = useMutation({
    mutationFn: (input: { title: string; description?: string; color?: string; tags?: string[] }) =>
      createProject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowNew(false);
      setNewProject({ title: '', description: '', tags: '', color: 'primary' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowDelete(null);
    },
  });

  const filtered = useMemo(
    () => projects.filter((p) => p.title.toLowerCase().includes(search.toLowerCase())),
    [projects, search]
  );

  const handleCreate = () => {
    if (!newProject.title.trim()) return;
    const tagsArray = newProject.tags
      ? newProject.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    createMutation.mutate({
      title: newProject.title.trim(),
      description: newProject.description.trim() || undefined,
      color: newProject.color,
      tags: tagsArray,
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userInitial = (user?.displayName || user?.email || 'U')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1c1b1d_0%,#131315_100%)] text-on-surface font-display">
      {/* Background */}
      <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-primary/8 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[30vw] h-[30vw] bg-secondary/4 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-4 md:px-6 py-3 bg-surface/60 backdrop-blur-lg rounded-xl mt-4 mx-4 border border-white/10 shadow-[0_0_15px_rgba(157,92,255,0.1)]">
        <Link to="/projects" className="flex items-center gap-2.5">
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
          <button className="p-2 rounded-full hover:bg-white/5 transition-all text-on-surface-variant" aria-label="Notifications">
            <Bell className="w-4 md:w-5 h-4 md:h-5" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-white/5 transition-all text-on-surface-variant hover:text-error"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 md:w-5 h-4 md:h-5" />
          </button>
          <div
            className="h-7 w-7 md:h-8 md:w-8 rounded-full border border-primary/40 p-0.5"
            title={user?.email || 'Active user'}
          >
            <div className="h-full w-full rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
              {userInitial}
            </div>
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
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-on-primary shadow-lg shadow-primary/20 hover:saturate-150 transition-all flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="glass-panel rounded-2xl border border-white/10 p-6 flex flex-col animate-pulse h-52 justify-between"
              >
                <div>
                  <div className="w-20 h-4 bg-white/10 rounded mb-4" />
                  <div className="w-3/4 h-6 bg-white/10 rounded mb-2" />
                  <div className="w-full h-4 bg-white/5 rounded mb-1" />
                  <div className="w-2/3 h-4 bg-white/5 rounded" />
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <div className="w-16 h-3 bg-white/10 rounded" />
                  <div className="w-12 h-3 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center py-16 text-center glass-panel rounded-2xl border border-error/20 p-8">
            <AlertCircle className="w-12 h-12 text-error mb-4" />
            <h3 className="text-lg font-bold text-on-surface mb-2">Failed to load projects</h3>
            <p className="text-sm text-on-surface-variant/70 max-w-md mb-6">
              {(error as Error)?.message || 'There was a problem connecting to the server.'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-16 h-16 text-outline-variant/30 mb-6" />
            <h3 className="text-xl font-bold text-on-surface mb-2">No projects found</h3>
            <p className="text-on-surface-variant/60 text-sm max-w-sm mb-6">
              {search ? 'No projects match your search.' : 'Create your first project to get started.'}
            </p>
            {search ? (
              <button
                onClick={() => setSearch('')}
                className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant font-medium text-sm hover:bg-white/10 transition-all"
              >
                Clear search
              </button>
            ) : (
              <button
                onClick={() => setShowNew(true)}
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:saturate-150 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Project
              </button>
            )}
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((project) => {
              const colorClass =
                project.color === 'secondary'
                  ? 'secondary'
                  : project.color === 'tertiary'
                  ? 'tertiary'
                  : 'primary';

              return (
                <div
                  key={project.id}
                  className="glass-panel group relative overflow-hidden rounded-2xl border border-white/10 p-6 flex flex-col hover:border-white/20 transition-all duration-300"
                >
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl transition-all duration-500 group-hover:bg-primary/12" />

                  {/* Tags + Delete */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {project.tags && project.tags.length > 0 ? (
                        project.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-surface-container px-2 py-0.5 rounded text-[10px] font-bold text-outline uppercase tracking-tighter"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="bg-surface-container/60 px-2 py-0.5 rounded text-[10px] font-medium text-outline/60 uppercase tracking-tighter">
                          General
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDelete(project.id);
                      }}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-error/10 transition-all"
                      aria-label={`Delete "${project.title}"`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-on-surface-variant/30 hover:text-error transition-colors" />
                    </button>
                  </div>

                  {/* Title + Desc */}
                  <h3 className="text-xl font-bold tracking-tight text-on-surface mb-2">{project.title}</h3>
                  <p className="text-sm text-on-surface-variant/70 mb-6 leading-relaxed line-clamp-2">
                    {project.description || 'No description provided.'}
                  </p>

                  {/* Meta */}
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3 text-[10px] font-bold">
                      <span className="flex items-center gap-1 text-primary">
                        <FileText className="w-3 h-3" />
                        {project.documentCount ?? 0} docs
                      </span>
                      <span className="flex items-center gap-1 text-outline">
                        <Clock className="w-3 h-3" />
                        {formatDate(project.updatedAt)}
                      </span>
                    </div>
                    <ViewTransitionLink
                      to={`/projects/${project.id}/notes`}
                      className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      Open
                      <ArrowRight className="w-3.5 h-3.5" />
                    </ViewTransitionLink>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onKeyDown={(e) => e.key === 'Escape' && setShowNew(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div
            className="glass-panel relative z-10 w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl p-8"
            role="dialog"
            aria-modal="true"
            aria-label="New Project"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-tight">New Project</h2>
              <button
                onClick={() => setShowNew(false)}
                className="p-2 rounded-full hover:bg-white/5 transition-all"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                placeholder="Project name *"
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

              {/* Color selector */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-on-surface-variant/70">Accent:</span>
                {(['primary', 'secondary', 'tertiary'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewProject({ ...newProject, color: c })}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      c === 'primary'
                        ? 'bg-[#d6baff]'
                        : c === 'secondary'
                        ? 'bg-[#00eefc]'
                        : 'bg-[#ff479c]'
                    } ${newProject.color === c ? 'border-white scale-110' : 'border-transparent opacity-60'}`}
                  />
                ))}
              </div>

              {createMutation.isError && (
                <p className="text-xs text-error">
                  {(createMutation.error as Error)?.message || 'Failed to create project.'}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant font-medium text-sm hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!newProject.title.trim() || createMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:saturate-150 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Create</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onKeyDown={(e) => e.key === 'Escape' && setShowDelete(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDelete(null)} />
          <div
            className="glass-panel relative z-10 w-full max-w-xs rounded-3xl border border-white/10 shadow-2xl p-8 text-center"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm delete"
          >
            <Trash2 className="w-10 h-10 text-error mx-auto mb-3" />
            <h2 className="text-lg font-bold mb-2">Delete project?</h2>
            <p className="text-xs text-on-surface-variant/70 mb-6">
              This project will be moved to the trash and retained for 30 days before being permanently purged.
            </p>
            {deleteMutation.isError && (
              <p className="text-xs text-error mb-3">
                {(deleteMutation.error as Error)?.message || 'Failed to delete.'}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant font-medium text-sm hover:bg-white/10 transition-all"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={() => handleDelete(showDelete)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-error/10 border border-error/20 text-error font-bold text-sm hover:bg-error/20 transition-all flex items-center justify-center gap-1.5"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
