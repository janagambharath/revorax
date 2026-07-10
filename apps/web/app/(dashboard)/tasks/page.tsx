'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import { formatDate } from '@revorax/shared';
import { toast } from 'sonner';
import { Plus, CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';

const PRIORITY_CONFIG: Record<string, { cls: string; label: string }> = {
  LOW: { cls: 'badge-gray', label: 'Low' },
  MEDIUM: { cls: 'badge-blue', label: 'Medium' },
  HIGH: { cls: 'badge-yellow', label: 'High' },
  URGENT: { cls: 'badge-red', label: 'Urgent' },
};

export default function TasksPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', statusFilter],
    queryFn: () => tasksApi.list({ status: statusFilter || undefined }) as any,
  });

  const completeTask = useMutation({
    mutationFn: (id: string) => tasksApi.update(id, { status: 'COMPLETED' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task completed!'); },
    onError: () => toast.error('Failed to update task'),
  });

  const tasks = data?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Tasks</h1>
          <p className="text-zinc-500 text-sm mt-1">Follow-ups, calls, and action items</p>
        </div>
        <button className="btn-primary text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> New Task</button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'PENDING', label: 'Pending', icon: Circle },
          { id: 'IN_PROGRESS', label: 'In Progress', icon: Clock },
          { id: 'COMPLETED', label: 'Completed', icon: CheckCircle },
          { id: '', label: 'All', icon: AlertCircle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              statusFilter === tab.id ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-surface-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mb-4" />
            <p className="text-zinc-400">No tasks in this category</p>
          </div>
        ) : (
          tasks.map((task: any) => {
            const isOverdue = task.dueAt && new Date(task.dueAt) < new Date() && task.status !== 'COMPLETED';
            const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
            return (
              <div key={task.id} className={`card-hover p-4 flex items-start gap-4 ${isOverdue ? 'border-red-500/30' : ''}`}>
                <button
                  onClick={() => task.status !== 'COMPLETED' && completeTask.mutate(task.id)}
                  className="mt-0.5 shrink-0"
                >
                  {task.status === 'COMPLETED'
                    ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                    : <Circle className="w-5 h-5 text-zinc-500 hover:text-brand-400 transition-colors" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <p className={`text-sm font-medium ${task.status === 'COMPLETED' ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                      {task.title}
                    </p>
                    <span className={`shrink-0 ${priority.cls}`}>{priority.label}</span>
                    {isOverdue && <span className="badge-red shrink-0">Overdue</span>}
                  </div>
                  {task.description && <p className="text-xs text-zinc-500 mt-1 truncate">{task.description}</p>}
                  <div className="flex items-center gap-4 mt-2">
                    {task.contact && (
                      <span className="text-xs text-zinc-500">👤 {task.contact.name}</span>
                    )}
                    {task.dueAt && (
                      <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-zinc-500'}`}>
                        <Clock className="w-3 h-3" /> {formatDate(task.dueAt)}
                      </span>
                    )}
                    {task.assignedTo && (
                      <span className="text-xs text-zinc-500">→ {task.assignedTo.name}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
