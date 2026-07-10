'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { getVerticalPack } from '@revorax/shared';
import { toast } from 'sonner';
import {
  Zap, Play, Pause, Clock,
  AlertCircle, ChevronRight, MessageSquare, Mail,
  ClipboardList,
} from 'lucide-react';

const ACTION_ICONS: Record<string, { icon: typeof Zap; label: string; color: string }> = {
  SEND_WHATSAPP: { icon: MessageSquare, label: 'Send WhatsApp', color: 'text-green-400' },
  SEND_EMAIL: { icon: Mail, label: 'Send Email', color: 'text-blue-400' },
  CREATE_TASK: { icon: ClipboardList, label: 'Create Task', color: 'text-amber-400' },
};

// Workflow API (inline since workflows may not have a dedicated api file yet)
const workflowsApi = {
  list: (params?: Record<string, unknown>) => api.get('/workflows' as any, { params }),
  toggle: (id: string, isActive: boolean) => api.patch(`/workflows/${id}` as any, { isActive }),
};

export default function WorkflowsPage() {
  const queryClient = useQueryClient();
  const { org } = useAuthStore();
  const pack = getVerticalPack(org?.businessType);

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowsApi.list() as any,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      workflowsApi.toggle(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow updated');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update workflow'),
  });

  const workflowList = (workflows as any)?.data || workflows || [];

  // Also show the vertical pack's default workflows that may not be created yet
  const packWorkflows = pack.workflows;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Automations</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Revenue recovery workflows for your {pack.shortLabel.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 flex items-start gap-3">
        <Zap className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-brand-300 font-medium text-sm">
            Automations run in the background to recover revenue
          </p>
          <p className="text-brand-400/70 text-xs mt-1">
            Each automation monitors your {pack.customerPluralLabel} and sends timely reminders to prevent revenue leakage.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Existing workflows from DB */}
          {workflowList.map((wf: any) => (
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              onToggle={(isActive) => toggleMutation.mutate({ id: wf.id, isActive })}
              isToggling={toggleMutation.isPending}
            />
          ))}

          {/* Pack-default workflows (shown as templates if not yet created in DB) */}
          {workflowList.length === 0 && packWorkflows.map((pw) => (
            <div key={pw.key} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-200">{pw.label}</h3>
                    <p className="text-xs text-zinc-500">Revenue leak: {pw.leak}</p>
                  </div>
                </div>
                <span className="badge-yellow">
                  <AlertCircle className="w-3 h-3" /> Not configured
                </span>
              </div>

              <div className="bg-surface-100 rounded-xl p-4 space-y-3">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Workflow Steps</p>
                {pw.steps.map((step, i) => {
                  const actionInfo = ACTION_ICONS[step.action] || ACTION_ICONS.CREATE_TASK;
                  const ActionIcon = actionInfo.icon;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-surface-200 flex items-center justify-center text-xs font-bold text-zinc-400">
                        {i + 1}
                      </div>
                      <ChevronRight className="w-3 h-3 text-zinc-600" />
                      <div className="flex items-center gap-2 flex-1">
                        <ActionIcon className={`w-4 h-4 ${actionInfo.color}`} />
                        <span className="text-sm text-zinc-300">{step.timing}</span>
                      </div>
                      {step.templateName && (
                        <span className="text-xs text-zinc-500 bg-surface-200 px-2 py-0.5 rounded">
                          {step.templateName}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-zinc-600 mt-3">
                This workflow will be automatically configured when you complete your {pack.shortLabel.toLowerCase()} onboarding.
              </p>
            </div>
          ))}

          {workflowList.length === 0 && packWorkflows.length === 0 && (
            <div className="card p-12 text-center">
              <Zap className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400 font-medium mb-2">No automations configured</p>
              <p className="text-zinc-500 text-sm">
                Automations will be set up during your onboarding process.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WorkflowCard({
  workflow,
  onToggle,
  isToggling,
}: {
  workflow: any;
  onToggle: (isActive: boolean) => void;
  isToggling: boolean;
}) {
  const steps = Array.isArray(workflow.steps) ? workflow.steps : [];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            workflow.isActive
              ? 'bg-emerald-500/10 border border-emerald-500/20'
              : 'bg-surface-200 border border-surface-300'
          }`}>
            <Zap className={`w-5 h-5 ${workflow.isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-200">{workflow.name}</h3>
            {workflow.description && (
              <p className="text-xs text-zinc-500">{workflow.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {workflow.lastRunAt && (
            <div className="text-xs text-zinc-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last run: {new Date(workflow.lastRunAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            </div>
          )}
          <button
            onClick={() => onToggle(!workflow.isActive)}
            disabled={isToggling}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
              workflow.isActive ? 'bg-emerald-500' : 'bg-surface-300'
            }`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
              workflow.isActive ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="badge-purple">
          Trigger: {workflow.trigger}
        </span>
        <span className={workflow.isActive ? 'badge-green' : 'badge-gray'}>
          {workflow.isActive ? <><Play className="w-3 h-3" /> Active</> : <><Pause className="w-3 h-3" /> Paused</>}
        </span>
      </div>

      {steps.length > 0 && (
        <div className="bg-surface-100 rounded-xl p-4 space-y-2">
          {steps.map((step: any, i: number) => {
            const actionInfo = ACTION_ICONS[step.action] || ACTION_ICONS.CREATE_TASK;
            const ActionIcon = actionInfo.icon;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-surface-200 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                  {i + 1}
                </div>
                <ActionIcon className={`w-3.5 h-3.5 ${actionInfo.color}`} />
                <span className="text-xs text-zinc-300">{step.timing}</span>
                <span className="text-xs text-zinc-600">→</span>
                <span className="text-xs text-zinc-400">{actionInfo.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
