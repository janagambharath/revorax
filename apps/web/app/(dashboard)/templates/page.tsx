'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { getVerticalPack } from '@revorax/shared';
import { toast } from 'sonner';
import {
  Plus, Search, FileText, MessageSquare, Mail,
  CheckCircle, Clock, XCircle, Trash2, X,
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  REMINDER: 'badge-yellow',
  FOLLOW_UP: 'badge-blue',
  RENEWAL: 'badge-green',
  WELCOME: 'badge-purple',
  MARKETING: 'badge-red',
  UTILITY: 'badge-gray',
  AUTHENTICATION: 'badge-gray',
  CUSTOM: 'badge-gray',
};

const CHANNEL_ICONS: Record<string, { icon: typeof MessageSquare; label: string }> = {
  WHATSAPP: { icon: MessageSquare, label: 'WhatsApp' },
  EMAIL: { icon: Mail, label: 'Email' },
};

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const { org } = useAuthStore();
  const pack = getVerticalPack(org?.businessType);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.list() as any,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => templatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowCreateModal(false);
      toast.success('Template created');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create template'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template deleted');
    },
  });

  const filtered = ((templates as any)?.data || templates || []).filter((t: any) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (channelFilter !== 'ALL' && t.channel !== channelFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Message Templates</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Pre-built message templates for {pack.customerPluralLabel} communication
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-1">
          {['ALL', 'WHATSAPP', 'EMAIL'].map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                channelFilter === ch
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-surface-100'
              }`}
            >
              {ch === 'ALL' ? 'All' : ch === 'WHATSAPP' ? '📱 WhatsApp' : '📧 Email'}
            </button>
          ))}
        </div>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium mb-2">No templates found</p>
          <p className="text-zinc-500 text-sm mb-6">
            Create your first message template to start sending automated {pack.retentionObject} reminders.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary text-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Template
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((t: any) => {
            const channelInfo = CHANNEL_ICONS[t.channel] || CHANNEL_ICONS.WHATSAPP;
            const ChannelIcon = channelInfo.icon;
            return (
              <div key={t.id} className="card p-5 hover:border-brand-500/20 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                      <ChannelIcon className="w-4 h-4 text-brand-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200">{t.name}</h3>
                      <p className="text-xs text-zinc-500">{channelInfo.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        if (confirm('Delete this template?')) deleteMutation.mutate(t.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={CATEGORY_COLORS[t.category] || 'badge-gray'}>
                    {t.category}
                  </span>
                  {t.whatsappStatus && (
                    <span className={
                      t.whatsappStatus === 'APPROVED' ? 'badge-green' :
                      t.whatsappStatus === 'REJECTED' ? 'badge-red' : 'badge-yellow'
                    }>
                      {t.whatsappStatus === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                      {t.whatsappStatus === 'PENDING' && <Clock className="w-3 h-3" />}
                      {t.whatsappStatus === 'REJECTED' && <XCircle className="w-3 h-3" />}
                      {t.whatsappStatus}
                    </span>
                  )}
                </div>

                <div className="bg-surface-100 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 leading-relaxed font-mono">{t.body}</p>
                </div>

                {t.variables && t.variables.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.variables.map((v: string) => (
                      <span key={v} className="text-[10px] bg-surface-200 text-zinc-400 px-2 py-0.5 rounded-md font-mono">
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <TemplateFormModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isSubmitting={createMutation.isPending}
          pack={pack}
        />
      )}
    </div>
  );
}

function TemplateFormModal({
  onClose,
  onSubmit,
  isSubmitting,
  pack,
  initialData,
}: {
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
  pack: any;
  initialData?: any;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [channel, setChannel] = useState(initialData?.channel || 'WHATSAPP');
  const [category, setCategory] = useState(initialData?.category || 'REMINDER');
  const [body, setBody] = useState(initialData?.body || '');
  const [subject, setSubject] = useState(initialData?.subject || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const variables = body.match(/{{(\w+)}}/g) || [];
    onSubmit({ name, channel, category, body, subject: channel === 'EMAIL' ? subject : undefined, variables });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-zinc-100">
            {initialData ? 'Edit Template' : 'Create Template'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-100 text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g. ${pack.shortLabel} ${pack.retentionObject} reminder`}
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Channel</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className="select">
                <option value="WHATSAPP">📱 WhatsApp</option>
                <option value="EMAIL">📧 Email</option>
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="select">
                <option value="REMINDER">Reminder</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="RENEWAL">Renewal</option>
                <option value="WELCOME">Welcome</option>
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utility</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          </div>

          {channel === 'EMAIL' && (
            <div>
              <label className="label">Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="input"
              />
            </div>
          )}

          <div>
            <label className="label">Message Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={pack.campaignPlaceholder}
              rows={5}
              className="input resize-none"
              required
            />
            <p className="text-xs text-zinc-600 mt-1.5">
              Use {'{{name}}'}, {'{{business_name}}'}, {'{{renewal_date}}'} etc. for personalization
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : initialData ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
