'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Columns3, X, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import SectionShell, { SectionShellAction } from './SectionShell';
import EmptyState from './EmptyState';
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  type Task,
  type TaskStatus,
  type TaskPriority,
} from '@/lib/api';

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-secondary/10 text-secondary border-secondary/20',
  medium: 'bg-primary/10 text-primary border-primary/20',
  high: 'bg-tertiary/10 text-tertiary border-tertiary/20',
};

const columns: { id: TaskStatus; label: string; dot: string }[] = [
  { id: 'todo', label: 'To Do', dot: 'bg-secondary' },
  { id: 'in-progress', label: 'In Progress', dot: 'bg-primary' },
  { id: 'done', label: 'Done', dot: 'bg-tertiary' },
];

export default function CanvasSection() {
  const params = useParams<{ id: string }>();
  const projectId = params.id as string;
  const queryClient = useQueryClient();

  const [showNew, setShowNew] = useState(false);
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    priority: TaskPriority;
  }>({
    title: '',
    description: '',
    priority: 'medium',
  });
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => listTasks(projectId),
    enabled: Boolean(projectId),
  });

  const createMutation = useMutation({
    mutationFn: (input: { title: string; description?: string; priority?: TaskPriority }) =>
      createTask(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setNewTask({ title: '', description: '', priority: 'medium' });
      setShowNew(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      taskId,
      input,
    }: {
      taskId: string;
      input: { status?: TaskStatus; priority?: TaskPriority; title?: string; description?: string };
    }) => updateTask(projectId, taskId, input),
    onMutate: async ({ taskId, input }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId]);
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          ['tasks', projectId],
          previousTasks.map((t) => (t.id === taskId ? { ...t, ...input } : t))
        );
      }
      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask(projectId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  const handleCreate = useCallback(() => {
    if (!newTask.title.trim() || createMutation.isPending) return;
    createMutation.mutate({
      title: newTask.title.trim(),
      description: newTask.description.trim() || undefined,
      priority: newTask.priority,
    });
  }, [createMutation, newTask]);

  const handleMove = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      setDragOver(null);
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status === newStatus) return;
      updateMutation.mutate({
        taskId,
        input: { status: newStatus },
      });
    },
    [tasks, updateMutation]
  );

  const getColumnTasks = useCallback(
    (status: TaskStatus) => tasks.filter((t) => t.status === status),
    [tasks]
  );

  return (
    <SectionShell
      title="Canvas"
      description="Kanban board to manage project tasks and activities."
      action={<SectionShellAction label="Add Task" onClick={() => setShowNew(true)} />}
      fullBleed
    >
      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 min-h-0">
          {columns.map((col) => (
            <div
              key={col.id}
              className="flex flex-col rounded-2xl border border-white/[0.08] bg-surface-container-low/30 overflow-hidden animate-pulse p-4"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.05] mb-4">
                <div className="w-24 h-4 bg-white/10 rounded" />
                <div className="w-6 h-4 bg-white/10 rounded-full" />
              </div>
              <div className="space-y-3">
                <div className="h-24 bg-white/[0.02] border border-white/5 rounded-xl p-3" />
                <div className="h-20 bg-white/[0.02] border border-white/5 rounded-xl p-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && isError && (
        <div className="flex flex-col items-center justify-center py-16 text-center glass-panel rounded-2xl border border-error/20 p-8 m-4">
          <AlertCircle className="w-12 h-12 text-error mb-4" />
          <h3 className="text-lg font-bold text-on-surface mb-2">Failed to load tasks</h3>
          <p className="text-sm text-on-surface-variant/70 max-w-md mb-6">
            {(error as Error)?.message || 'Could not connect to the backend server.'}
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

      {/* Empty State when no tasks at all */}
      {!isLoading && !isError && tasks.length === 0 ? (
        <EmptyState
          icon={Columns3}
          title="No tasks yet"
          description="Create your first task and organize your workflow."
          action={
            <button
              onClick={() => setShowNew(true)}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:saturate-150 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          }
        />
      ) : !isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 min-h-0">
          {columns.map((col) => {
            const columnTasks = getColumnTasks(col.id);
            return (
              <div
                key={col.id}
                className="flex flex-col rounded-2xl border border-white/[0.08] bg-surface-container-low/30 overflow-hidden"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(col.id);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const tid = e.dataTransfer.getData('taskId');
                  if (tid) handleMove(tid, col.id);
                }}
              >
                <div className="p-4 border-b border-white/[0.05] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <h3 className="font-bold text-on-surface text-xs uppercase tracking-wider">
                      {col.label}
                    </h3>
                  </div>
                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-outline font-bold">
                    {columnTasks.length}
                  </span>
                </div>
                <div
                  className={`flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar min-h-[200px] transition-colors ${
                    dragOver === col.id ? 'bg-primary/[0.04] ring-1 ring-inset ring-primary/20' : ''
                  }`}
                >
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                      className="group rounded-xl border border-white/[0.08] p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all bg-white/[0.02] hover:bg-white/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-on-surface text-xs leading-snug">
                          {task.title}
                        </h4>
                        <button
                          onClick={() => deleteMutation.mutate(task.id)}
                          disabled={deleteMutation.isPending}
                          className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-error/10 transition-all flex-shrink-0"
                          aria-label={`Delete "${task.title}"`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-on-surface-variant/30 hover:text-error transition-colors" />
                        </button>
                      </div>
                      {task.description && (
                        <p className="text-[11px] text-on-surface-variant/60 mb-3 leading-relaxed line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] border font-bold uppercase tracking-widest ${
                            priorityColors[task.priority]
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-on-surface-variant/25 text-xs border border-dashed border-white/5 rounded-xl">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Task Modal */}
      {showNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onKeyDown={(e) => e.key === 'Escape' && setShowNew(false)}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNew(false)}
          />
          <div
            className="glass-panel relative z-10 w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-8"
            role="dialog"
            aria-modal="true"
            aria-label="New Task"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-on-surface">New Task</h2>
              <button
                onClick={() => setShowNew(false)}
                className="p-2 rounded-full hover:bg-white/5"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-outline uppercase tracking-widest font-bold mb-1.5 block">
                  Title
                </label>
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
                <label className="text-[10px] text-outline uppercase tracking-widest font-bold mb-1.5 block">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Optional description"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-outline/50 focus:border-primary outline-none resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-outline uppercase tracking-widest font-bold mb-1.5 block">
                  Priority
                </label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewTask({ ...newTask, priority: p })}
                      className={`flex-1 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${
                        newTask.priority === p
                          ? priorityColors[p] + ' border-current shadow-sm'
                          : 'border-white/5 text-on-surface-variant/30 hover:border-white/10'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!newTask.title.trim() || createMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-lg shadow-primary/20 hover:saturate-150 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SectionShell>
  );
}
