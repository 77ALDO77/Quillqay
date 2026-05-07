'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2, Columns3, X } from 'lucide-react';
import SectionShell, { SectionShellAction } from './SectionShell';
import EmptyState from './EmptyState';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
}

const priorityColors: Record<Task['priority'], string> = {
  low: 'bg-secondary/10 text-secondary border-secondary/20',
  medium: 'bg-primary/10 text-primary border-primary/20',
  high: 'bg-tertiary/10 text-tertiary border-tertiary/20',
};

const columns = [
  { id: 'todo' as const, label: 'To Do', dot: 'secondary' },
  { id: 'in-progress' as const, label: 'In Progress', dot: 'primary' },
  { id: 'done' as const, label: 'Done', dot: 'tertiary' },
];

const demoTasks: Task[] = [
  { id: 't1', title: 'Design landing page', description: 'Create liquid glass layout', status: 'done', priority: 'high' },
  { id: 't2', title: 'Implement auth flow', description: 'Google and GitHub OAuth', status: 'in-progress', priority: 'high' },
  { id: 't3', title: 'Add drag and drop', description: 'Kanban card dragging', status: 'todo', priority: 'medium' },
  { id: 't4', title: 'Write API docs', description: 'Document all endpoints', status: 'todo', priority: 'low' },
  { id: 't5', title: 'Set up CI/CD', description: 'GitHub Actions', status: 'done', priority: 'medium' },
  { id: 't6', title: 'DB backup script', description: 'Automated pg_dump', status: 'in-progress', priority: 'low' },
  { id: 't7', title: 'Error monitoring', description: 'Sentry integration', status: 'todo', priority: 'medium' },
];

export default function CanvasSection() {
  const [tasks, setTasks] = useState<Task[]>(demoTasks);
  const [showNew, setShowNew] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as Task['priority'] });
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleCreate = useCallback(() => {
    if (!newTask.title.trim()) return;
    setTasks((prev) => [{ id: `task-${Date.now()}`, title: newTask.title.trim(), description: newTask.description.trim(), status: 'todo', priority: newTask.priority }, ...prev]);
    setNewTask({ title: '', description: '', priority: 'medium' });
    setShowNew(false);
  }, [newTask]);

  const handleMove = useCallback((taskId: string, newStatus: Task['status']) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    setDragOver(null);
  }, []);

  const getColumnTasks = useCallback(
    (status: Task['status']) => tasks.filter((t) => t.status === status),
    [tasks]
  );

  return (
    <SectionShell
      title="Canvas"
      description="Kanban board to manage project tasks and activities."
      action={<SectionShellAction label="Add Task" onClick={() => setShowNew(true)} />}
      fullBleed
    >
      {tasks.length === 0 ? (
        <EmptyState icon={Columns3} title="No tasks yet" description="Create your first task and organize your workflow." action={
          <button onClick={() => setShowNew(true)} className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:saturate-150 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />Add Task
          </button>
        } />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 min-h-0">
          {columns.map((col) => {
            const columnTasks = getColumnTasks(col.id);
            return (
              <div key={col.id} className={`flex flex-col rounded-2xl border border-white/[0.08] bg-surface-container-low/30 overflow-hidden`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => { e.preventDefault(); const tid = e.dataTransfer.getData('taskId'); if (tid) handleMove(tid, col.id); }}
              >
                <div className="p-4 border-b border-white/[0.05] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${col.dot}`} />
                    <h3 className="font-bold text-on-surface text-xs uppercase tracking-wider">{col.label}</h3>
                  </div>
                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-outline font-bold">{columnTasks.length}</span>
                </div>
                <div className={`flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar min-h-[200px] ${dragOver === col.id ? 'bg-primary/[0.03]' : ''}`}>
                  {columnTasks.map((task) => (
                    <div key={task.id} draggable onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                      className="group rounded-xl border border-white/[0.08] p-3 cursor-grab active:cursor-grabbing hover:border-primary/20 transition-all bg-white/[0.02]"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-on-surface text-xs">{task.title}</h4>
                        <button onClick={() => setTasks(tasks.filter((t) => t.id !== task.id))} className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-error/10 transition-all flex-shrink-0" aria-label={`Delete "${task.title}"`}>
                          <Trash2 className="w-3 h-3 text-on-surface-variant/30 hover:text-error" />
                        </button>
                      </div>
                      {task.description && <p className="text-[11px] text-on-surface-variant/60 mb-3 leading-relaxed line-clamp-2">{task.description}</p>}
                      <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] border font-bold uppercase tracking-widest ${priorityColors[task.priority]}`}>{task.priority}</span>
                    </div>
                  ))}
                  {columnTasks.length === 0 && <div className="flex items-center justify-center h-14 text-on-surface-variant/20 text-xs">Drop tasks here</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={(e) => e.key === 'Escape' && setShowNew(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="glass-panel relative z-10 w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-8" role="dialog" aria-modal="true" aria-label="New Task">
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-bold">New Task</h2><button onClick={() => setShowNew(false)} className="p-2 rounded-full hover:bg-white/5" aria-label="Close"><X className="w-5 h-5 text-on-surface-variant" /></button></div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-outline uppercase tracking-widest font-bold mb-1.5 block">Title</label>
                <input type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="Task title" className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-outline/50 focus:border-primary outline-none" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
              </div>
              <div>
                <label className="text-[10px] text-outline uppercase tracking-widest font-bold mb-1.5 block">Description</label>
                <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} placeholder="Optional" rows={2} className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-outline/50 focus:border-primary outline-none resize-none" />
              </div>
              <div>
                <label className="text-[10px] text-outline uppercase tracking-widest font-bold mb-1.5 block">Priority</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as Task['priority'][]).map((p) => (
                    <button key={p} onClick={() => setNewTask({ ...newTask, priority: p })} className={`flex-1 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${newTask.priority === p ? priorityColors[p] + ' border-current' : 'border-white/5 text-on-surface-variant/30 hover:border-white/10'}`}>{p}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowNew(false)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant text-sm font-medium hover:bg-white/10">Cancel</button>
                <button onClick={handleCreate} disabled={!newTask.title.trim()} className="flex-1 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-lg shadow-primary/20 hover:saturate-150 disabled:opacity-50">Add Task</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SectionShell>
  );
}
