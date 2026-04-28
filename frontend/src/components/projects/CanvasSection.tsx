'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, X } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
}

const priorityColors = {
  low: 'bg-secondary/20 text-secondary border-secondary/30',
  medium: 'bg-primary/20 text-primary border-primary/30',
  high: 'bg-tertiary/20 text-tertiary border-tertiary/30',
};

const columns = [
  { id: 'todo', label: 'To Do', color: 'border-secondary/30' },
  { id: 'in-progress', label: 'In Progress', color: 'border-primary/30' },
  { id: 'done', label: 'Done', color: 'border-tertiary/30' },
] as const;

const demoTasks: Task[] = [
  { id: 't1', title: 'Design landing page', description: 'Create liquid glass layout for the marketing page', status: 'done', priority: 'high' },
  { id: 't2', title: 'Implement auth flow', description: 'Google and GitHub OAuth integration', status: 'in-progress', priority: 'high' },
  { id: 't3', title: 'Add drag and drop', description: 'Kanban board card dragging between columns', status: 'todo', priority: 'medium' },
  { id: 't4', title: 'Write API docs', description: 'Document all endpoints with examples', status: 'todo', priority: 'low' },
  { id: 't5', title: 'Set up CI/CD', description: 'GitHub Actions for build and deploy', status: 'done', priority: 'medium' },
  { id: 't6', title: 'Database backup script', description: 'Automated pg_dump with rotation', status: 'in-progress', priority: 'low' },
  { id: 't7', title: 'Error monitoring', description: 'Sentry integration for both frontend and backend', status: 'todo', priority: 'medium' },
];

export default function CanvasSection() {
  const [tasks, setTasks] = useState<Task[]>(demoTasks);
  const [showNew, setShowNew] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as Task['priority'] });
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newTask.title.trim()) return;
    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      status: 'todo',
      priority: newTask.priority,
    };
    setTasks([task, ...tasks]);
    setNewTask({ title: '', description: '', priority: 'medium' });
    setShowNew(false);
  };

  const handleDelete = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const handleMove = (taskId: string, newStatus: Task['status']) => {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    setDragOver(null);
  };

  const getColumnTasks = (status: Task['status']) => tasks.filter((t) => t.status === status);

  return (
    <div className="min-h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-on-surface mb-2">Canvas</h1>
          <p className="text-on-surface-variant/70 text-sm">Kanban board to manage project tasks and activities.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-on-primary shadow-lg shadow-primary/20 hover:saturate-150 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-300px)]">
        {columns.map((col) => {
          const columnTasks = getColumnTasks(col.id);
          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-2xl border ${col.color} bg-surface-container-low/50 border-white/10 overflow-hidden`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(col.id);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData('taskId');
                if (taskId) handleMove(taskId, col.id);
              }}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-${col.id === 'todo' ? 'secondary' : col.id === 'in-progress' ? 'primary' : 'tertiary'}`} />
                  <h3 className="font-bold text-on-surface text-sm">{col.label}</h3>
                </div>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-outline font-bold">
                  {columnTasks.length}
                </span>
              </div>

              {/* Column Tasks */}
              <div className={`flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar ${dragOver === col.id ? 'bg-primary/5' : ''}`}>
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                    className="group glass-panel rounded-xl border border-white/10 p-4 cursor-grab active:cursor-grabbing hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-on-surface text-sm">{task.title}</h4>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-error/10 transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-on-surface-variant/40 hover:text-error transition-colors" />
                      </button>
                    </div>
                    {task.description && (
                      <p className="text-xs text-on-surface-variant/70 mb-3 leading-relaxed line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] border font-bold uppercase tracking-wider ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
                {columnTasks.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-on-surface-variant/30 text-xs">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="glass-panel relative z-10 w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-tight">New Task</h2>
              <button onClick={() => setShowNew(false)} className="p-2 rounded-full hover:bg-white/5 transition-all">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-outline uppercase tracking-widest font-bold mb-1.5 block">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Task title"
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-outline/50 focus:border-primary outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div>
                <label className="text-[10px] text-outline uppercase tracking-widest font-bold mb-1.5 block">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Optional description"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-outline/50 focus:border-primary outline-none resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-outline uppercase tracking-widest font-bold mb-1.5 block">Priority</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as Task['priority'][])
                    .map((p) => (
                      <button
                        key={p}
                        onClick={() => setNewTask({ ...newTask, priority: p })}
                        className={`flex-1 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${
                          newTask.priority === p
                            ? priorityColors[p] + ' border-current'
                            : 'border-white/5 text-on-surface-variant/40 hover:border-white/10'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNew(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant font-medium text-sm hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newTask.title.trim()}
                  className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:saturate-150 transition-all disabled:opacity-50"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
