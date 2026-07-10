'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi } from '@/lib/api';
import { formatDate, getVerticalPack } from '@revorax/shared';
import { toast } from 'sonner';
import { Plus, Send, Clock, CheckCircle, XCircle, Megaphone, Users } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  DRAFT: { label: 'Draft', cls: 'badge-gray', icon: Clock },
  SCHEDULED: { label: 'Scheduled', cls: 'badge-blue', icon: Clock },
  RUNNING: { label: 'Running', cls: 'badge-yellow', icon: Send },
  COMPLETED: { label: 'Completed', cls: 'badge-green', icon: CheckCircle },
  FAILED: { label: 'Failed', cls: 'badge-red', icon: XCircle },
};

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function CampaignsPage() {
  const qc = useQueryClient();
  const { org } = useAuthStore();
  const pack = getVerticalPack(org?.businessType);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', channel: 'WHATSAPP', customBody: '', audienceFilter: {} as Record<string, unknown> });

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.list() as any,
  });

  const createCampaign = useMutation({
    mutationFn: (data: Record<string, unknown>) => campaignsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); setShowCreate(false); toast.success('Campaign created!'); },
    onError: () => toast.error('Failed to create campaign'),
  });

  const executeCampaign = useMutation({
    mutationFn: (id: string) => campaignsApi.execute(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); toast.success('Campaign sending started!'); },
    onError: () => toast.error('Failed to execute campaign'),
  });

  const campaigns: any[] = data?.data || [];
  const audienceStatuses = [
    { value: 'ACTIVE', label: pack.activeLabel },
    { value: 'TRIAL', label: titleCase(pack.trialLabel) },
    { value: 'EXPIRED', label: titleCase(pack.inactiveLabel) },
    { value: 'FROZEN', label: 'Paused' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Campaigns</h1>
          <p className="text-zinc-500 text-sm mt-1">WhatsApp and email campaigns for {pack.campaignAudienceLabel}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal-content p-6">
            <h2 className="text-lg font-bold text-zinc-100 mb-6">Create Campaign</h2>

            <div className="space-y-4">
              <div>
                <label className="label">Campaign Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={`e.g. ${pack.recoveryListLabel}`} className="input" />
              </div>

              <div>
                <label className="label">Starter Templates</label>
                <div className="grid gap-2">
                  {pack.templates.map((template) => (
                    <button
                      key={template.name}
                      type="button"
                      onClick={() => setForm({ ...form, channel: template.channel, name: form.name || template.name, customBody: template.body })}
                      className="rounded-xl border border-surface-300 px-3 py-2 text-left text-xs text-zinc-400 hover:border-brand-500/40 hover:bg-brand-500/5"
                    >
                      <span className="font-semibold text-zinc-300">{template.name}</span>
                      <span className="block mt-1 line-clamp-2">{template.body}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Channel</label>
                <div className="flex gap-2">
                  {(['WHATSAPP', 'EMAIL'] as const).map((ch) => (
                    <button key={ch} type="button" onClick={() => setForm({ ...form, channel: ch })} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${form.channel === ch ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-surface-300 text-zinc-500'}`}>
                      {ch === 'WHATSAPP' ? 'WhatsApp' : 'Email'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Audience Filter</label>
                <div className="flex gap-2 flex-wrap">
                  {audienceStatuses.map((status) => {
                    const sel = (form.audienceFilter.memberStatus as string[] || []);
                    const isSelected = sel.includes(status.value);
                    return (
                      <button key={status.value} type="button" onClick={() => {
                        const next = isSelected ? sel.filter((s) => s !== status.value) : [...sel, status.value];
                        setForm({ ...form, audienceFilter: { ...form.audienceFilter, memberStatus: next } });
                      }} className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${isSelected ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-surface-300 text-zinc-500'}`}>
                        {status.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="label">Message Body</label>
                <textarea value={form.customBody} onChange={(e) => setForm({ ...form, customBody: e.target.value })} placeholder={pack.campaignPlaceholder} className="input resize-none h-28 text-sm" />
                <p className="text-xs text-zinc-600 mt-1">Variables: {'{{name}}'}, {'{{phone}}'}, {'{{email}}'}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => createCampaign.mutate(form)} disabled={!form.name || !form.customBody} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Megaphone className="w-4 h-4" /> Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="w-12 h-12 text-zinc-600 mb-4" />
            <p className="text-zinc-400 font-medium">No campaigns yet</p>
            <p className="text-zinc-600 text-sm mt-1">Create your first campaign for {pack.campaignAudienceLabel}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Channel</th>
                <th>Recipients</th>
                <th>Sent</th>
                <th>Delivery</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c: any) => {
                const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.DRAFT;
                const deliveryRate = c.sentCount > 0 ? Math.round(((c.deliveredCount || 0) / c.sentCount) * 100) : 0;
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                          <Megaphone className="w-4 h-4 text-brand-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-200">{c.name}</p>
                          {c.template && <p className="text-xs text-zinc-500">Template: {c.template.name}</p>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={c.channel === 'WHATSAPP' ? 'badge-green' : 'badge-blue'}>
                        {c.channel}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-zinc-300 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {c.recipientCount || 0}
                      </span>
                    </td>
                    <td className="text-sm text-zinc-300">{c.sentCount || 0}</td>
                    <td>
                      {c.sentCount > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-surface-200 rounded-full h-1.5 max-w-16">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${deliveryRate}%` }} />
                          </div>
                          <span className="text-xs text-zinc-400">{deliveryRate}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
                    <td><span className={statusCfg.cls}>{statusCfg.label}</span></td>
                    <td><span className="text-xs text-zinc-500">{formatDate(c.createdAt)}</span></td>
                    <td>
                      {(c.status === 'DRAFT' || c.status === 'SCHEDULED') && (
                        <button onClick={() => executeCampaign.mutate(c.id)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                          <Send className="w-3 h-3" /> Send
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
