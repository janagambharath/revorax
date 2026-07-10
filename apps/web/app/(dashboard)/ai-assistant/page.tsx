'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiApi, contactsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Sparkles, Send, Copy, RefreshCw, MessageSquare, BarChart3, Zap, Search, User } from 'lucide-react';
import { getVerticalPack } from '@revorax/shared';
import { useAuthStore } from '@/stores/auth.store';

const PROMPT_ICONS = [RefreshCw, Zap, MessageSquare, BarChart3];

export default function AIAssistantPage() {
  const { org } = useAuthStore();
  const pack = getVerticalPack(org?.businessType);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [channel, setChannel] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [context, setContext] = useState('');
  const [result, setResult] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: contacts } = useQuery({
    queryKey: ['contacts', 'search', contactSearch],
    queryFn: () => contactsApi.list({ search: contactSearch, limit: 5 }) as any,
    enabled: contactSearch.length > 2,
  });
  const quickPrompts = pack.aiQuickPrompts.map((prompt, index) => ({
    ...prompt,
    icon: PROMPT_ICONS[index % PROMPT_ICONS.length],
  }));

  const generateFollowUp = async () => {
    if (!selectedContact) { toast.error('Select a contact first'); return; }
    setIsGenerating(true);
    try {
      const data = await aiApi.followUp({ contactId: selectedContact.id, channel, context }) as any;
      setResult(data.suggestion);
    } catch {
      toast.error('AI generation failed. Check API key configuration.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCopy = async (purpose: string) => {
    setIsGenerating(true);
    setResult('');
    try {
      const data = await aiApi.generateCopy({ purpose, channel, audience: pack.campaignAudienceLabel, tone: 'friendly' }) as any;
      setResult(data.body);
    } catch {
      toast.error('AI generation failed. Check API key configuration.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          AI Revenue Assistant
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Draft follow-ups, generate campaign copy, and protect {pack.retentionObject} revenue
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Controls */}
        <div className="space-y-5">
          {/* Quick prompts */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Quick Generate</h3>
            <div className="grid grid-cols-2 gap-2">
              {quickPrompts.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setContext(p.context); generateCopy(p.context); }}
                  disabled={isGenerating}
                  className="flex items-start gap-2 p-3 rounded-xl border border-surface-300 hover:border-brand-500/40 hover:bg-brand-500/5 transition-all text-left"
                >
                  <p.icon className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-zinc-400">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contact-specific generation */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300">Generate for Specific Contact</h3>

            {/* Contact search */}
            <div>
              <label className="label">Search Contact</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Type name or phone..."
                  className="input pl-10"
                />
              </div>
              {contacts?.data?.length > 0 && contactSearch.length > 2 && (
                <div className="mt-2 border border-surface-300 rounded-xl overflow-hidden">
                  {contacts.data.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedContact(c); setContactSearch(c.name); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-100 transition-colors text-left border-b border-surface-200 last:border-0"
                    >
                      <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 text-xs font-bold">
                        {c.name[0]}
                      </div>
                      <div>
                        <p className="text-sm text-zinc-200">{c.name}</p>
                        <p className="text-xs text-zinc-500">{c.phone || c.email || 'No contact info'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedContact && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20">
                <User className="w-4 h-4 text-brand-400" />
                <span className="text-sm text-brand-300 font-medium">{selectedContact.name}</span>
                <button onClick={() => { setSelectedContact(null); setContactSearch(''); }} className="ml-auto text-zinc-500 hover:text-zinc-300 text-xs">×</button>
              </div>
            )}

            {/* Channel */}
            <div>
              <label className="label">Channel</label>
              <div className="flex gap-2">
                {(['WHATSAPP', 'EMAIL'] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                      channel === ch ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-surface-300 text-zinc-500 hover:border-surface-400'
                    }`}
                  >
                    {ch === 'WHATSAPP' ? 'WhatsApp' : 'Email'}
                  </button>
                ))}
              </div>
            </div>

            {/* Context */}
            <div>
              <label className="label">Additional Context (optional)</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder={`e.g. ${pack.painPoint}`}
                className="input resize-none h-20 text-sm"
              />
            </div>

            <button
              onClick={generateFollowUp}
              disabled={isGenerating || !selectedContact}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGenerating ? 'Generating...' : 'Generate Follow-up'}
            </button>
          </div>
        </div>

        {/* Right: Result */}
        <div className="card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-300">Generated Message</h3>
            {result && (
              <div className="flex gap-2">
                <button onClick={copyToClipboard} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                  <Copy className="w-3 h-3" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={() => setResult('')} className="btn-ghost text-xs py-1.5 px-3">Clear</button>
              </div>
            )}
          </div>

          {isGenerating ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-500 text-sm">AI is crafting your message...</p>
            </div>
          ) : result ? (
            <div className="flex-1">
              <div className="bg-surface-100 rounded-xl p-4 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap border border-surface-200">
                {result}
              </div>
              <div className="mt-4 flex gap-2">
                <button className="btn-primary text-sm flex items-center gap-2 flex-1 justify-center">
                  <Send className="w-4 h-4" /> Send via {channel === 'WHATSAPP' ? 'WhatsApp' : 'Email'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-brand-400" />
              </div>
              <div>
                <p className="text-zinc-400 font-medium">Ready to generate</p>
                <p className="text-zinc-600 text-sm mt-1">
                  Select a quick prompt or search for a contact to generate a personalized message
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
