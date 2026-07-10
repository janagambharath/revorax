'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Search } from 'lucide-react';

const STAGES = [
  { id: 'NEW', label: 'New', color: 'border-blue-500/30 bg-blue-500/5' },
  { id: 'CONTACTED', label: 'Contacted', color: 'border-yellow-500/30 bg-yellow-500/5' },
  { id: 'INTERESTED', label: 'Interested', color: 'border-orange-500/30 bg-orange-500/5' },
  { id: 'TRIAL', label: 'Trial', color: 'border-purple-500/30 bg-purple-500/5' },
  { id: 'CONVERTED', label: 'Converted', color: 'border-emerald-500/30 bg-emerald-500/5' },
];

const SOURCE_LABELS: Record<string, string> = {
  WALK_IN: 'Walk-in', REFERRAL: 'Referral', WEBSITE: 'Website',
  SOCIAL_MEDIA: 'Social', COLD_CALL: 'Cold call', CAMPAIGN: 'Campaign', OTHER: 'Other',
};

export default function LeadsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads', 'all'],
    queryFn: () => leadsApi.list({ limit: 100 }) as any,
  });

  const updateLead = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => leadsApi.update(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); },
    onError: () => toast.error('Failed to update lead'),
  });

  const allLeads: any[] = leadsData?.data || [];
  const filtered = search
    ? allLeads.filter((l: any) => l.contact?.name?.toLowerCase().includes(search.toLowerCase()))
    : allLeads;

  const getStageLeads = (stageId: string) => filtered.filter((l: any) => l.status === stageId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Lead Pipeline</h1>
          <p className="text-zinc-500 text-sm mt-1">Track and convert leads to members</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="input pl-10 w-64"
            />
          </div>
          <button className="btn-primary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {STAGES.map((stage) => {
            const stageLeads = getStageLeads(stage.id);
            return (
              <div key={stage.id} className={`flex-shrink-0 w-72 rounded-2xl border ${stage.color} p-4`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm text-zinc-300">{stage.label}</h3>
                  <span className="text-xs bg-surface-200 text-zinc-400 px-2 py-0.5 rounded-full">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {stageLeads.map((lead: any) => (
                    <div key={lead.id} className="card p-4 hover:border-brand-500/30 transition-all cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 text-sm font-bold shrink-0">
                          {lead.contact?.name?.[0] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-zinc-200 text-sm truncate">{lead.contact?.name}</p>
                          <p className="text-xs text-zinc-500">{SOURCE_LABELS[lead.source] || lead.source}</p>
                          {lead.contact?.phone && (
                            <p className="text-xs text-zinc-600 mt-1">{lead.contact.phone}</p>
                          )}
                        </div>
                        {lead.score > 0 && (
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${lead.score >= 70 ? 'text-emerald-400 bg-emerald-500/10' : lead.score >= 40 ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-500 bg-surface-200'}`}>
                            {lead.score}
                          </span>
                        )}
                      </div>
                      {/* Move to next stage buttons */}
                      <div className="flex gap-1 mt-3">
                        {STAGES.filter((s) => s.id !== stage.id).slice(0, 2).map((s) => (
                          <button
                            key={s.id}
                            onClick={() => updateLead.mutate({ id: lead.id, status: s.id })}
                            className="text-xs px-2 py-1 rounded-lg bg-surface-200 text-zinc-500 hover:text-zinc-300 hover:bg-surface-300 transition-colors"
                          >
                            → {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <p className="text-xs text-zinc-600 text-center py-4">No leads</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
