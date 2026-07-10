'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { messagesApi, contactsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { getVerticalPack, formatRelative } from '@revorax/shared';
import {
  Search, MessageSquare, Mail, Phone, ChevronRight,
  CheckCheck, Check, Clock, XCircle, ArrowUpRight,
  Send, User,
} from 'lucide-react';

const STATUS_ICONS: Record<string, { icon: typeof Check; color: string; label: string }> = {
  QUEUED: { icon: Clock, color: 'text-zinc-500', label: 'Queued' },
  SENT: { icon: Check, color: 'text-blue-400', label: 'Sent' },
  DELIVERED: { icon: CheckCheck, color: 'text-emerald-400', label: 'Delivered' },
  READ: { icon: CheckCheck, color: 'text-brand-400', label: 'Read' },
  FAILED: { icon: XCircle, color: 'text-red-400', label: 'Failed' },
};

const CHANNEL_LABELS: Record<string, { icon: typeof MessageSquare; label: string }> = {
  WHATSAPP: { icon: MessageSquare, label: 'WhatsApp' },
  EMAIL: { icon: Mail, label: 'Email' },
  SMS: { icon: Phone, label: 'SMS' },
  IN_APP: { icon: MessageSquare, label: 'In-App' },
};

export default function MessagesPage() {
  const { org } = useAuthStore();
  const pack = getVerticalPack(org?.businessType);
  const [search, setSearch] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string>('ALL');

  // List contacts to show conversation threads
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts', 'messages-list'],
    queryFn: () => contactsApi.list({ limit: 100 }) as any,
  });

  // Messages for selected contact
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedContactId],
    queryFn: () => messagesApi.byContact(selectedContactId!) as any,
    enabled: !!selectedContactId,
  });

  const contactList = ((contacts as any)?.data || contacts || []).filter((c: any) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  const messageList = (messages as any)?.data || messages || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Messages</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Conversations with your {pack.customerPluralLabel}
        </p>
      </div>

      <div className="card overflow-hidden" style={{ height: 'calc(100vh - 240px)' }}>
        <div className="flex h-full">
          {/* Contact List (Left Panel) */}
          <div className="w-80 border-r border-surface-200 flex flex-col shrink-0">
            <div className="p-3 border-b border-surface-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder={`Search ${pack.customerPluralLabel}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {contactsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : contactList.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <User className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-500 text-xs">No {pack.customerPluralLabel} found</p>
                </div>
              ) : (
                contactList.map((contact: any) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContactId(contact.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-100 transition-colors border-b border-surface-100 ${
                      selectedContactId === contact.id ? 'bg-surface-100' : ''
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold shrink-0">
                      {contact.name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{contact.name}</p>
                      <p className="text-xs text-zinc-500 truncate">
                        {contact.phone || contact.email || 'No contact info'}
                      </p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message Thread (Right Panel) */}
          <div className="flex-1 flex flex-col">
            {!selectedContactId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-brand-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">Select a conversation</h3>
                <p className="text-zinc-500 text-sm max-w-sm">
                  Choose a {pack.customerLabel} from the list to view their message history and send follow-ups.
                </p>
              </div>
            ) : (
              <>
                {/* Thread Header */}
                <div className="px-5 py-3 border-b border-surface-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold">
                      {contactList.find((c: any) => c.id === selectedContactId)?.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">
                        {contactList.find((c: any) => c.id === selectedContactId)?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {contactList.find((c: any) => c.id === selectedContactId)?.phone || ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {['ALL', 'WHATSAPP', 'EMAIL'].map((ch) => (
                      <button
                        key={ch}
                        onClick={() => setChannelFilter(ch)}
                        className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                          channelFilter === ch
                            ? 'bg-brand-600/20 text-brand-300'
                            : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                      >
                        {ch === 'ALL' ? 'All' : ch}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-hide">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : messageList.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                      <p className="text-zinc-500 text-sm">No messages yet</p>
                      <p className="text-zinc-600 text-xs mt-1">
                        Send a WhatsApp message or email to start the conversation.
                      </p>
                    </div>
                  ) : (
                    messageList
                      .filter((m: any) => channelFilter === 'ALL' || m.channel === channelFilter)
                      .map((msg: any) => {
                        const statusInfo = STATUS_ICONS[msg.status] || STATUS_ICONS.QUEUED;
                        const StatusIcon = statusInfo.icon;
                        const channelInfo = CHANNEL_LABELS[msg.channel] || CHANNEL_LABELS.WHATSAPP;
                        const ChannelIcon = channelInfo.icon;
                        const isOutbound = msg.direction === 'OUTBOUND';

                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                                isOutbound
                                  ? 'bg-brand-600/20 border border-brand-500/20 rounded-br-sm'
                                  : 'bg-surface-100 border border-surface-200 rounded-bl-sm'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <ChannelIcon className="w-3 h-3 text-zinc-500" />
                                <span className="text-[10px] text-zinc-500 font-medium">
                                  {channelInfo.label}
                                </span>
                                {isOutbound && (
                                  <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                                )}
                              </div>
                              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                {msg.body}
                              </p>
                              <div className="flex items-center justify-end gap-2 mt-2">
                                <span className="text-[10px] text-zinc-600">
                                  {formatRelative(msg.sentAt || msg.createdAt)}
                                </span>
                                {isOutbound && (
                                  <StatusIcon className={`w-3 h-3 ${statusInfo.color}`} />
                                )}
                              </div>
                              {msg.failReason && (
                                <p className="text-[10px] text-red-400 mt-1">{msg.failReason}</p>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Quick Actions */}
                <div className="px-5 py-3 border-t border-surface-200 flex items-center gap-3">
                  <div className="flex-1 text-xs text-zinc-500">
                    Use templates or campaigns to send messages to this {pack.customerLabel}.
                  </div>
                  <a
                    href={`/dashboard/campaigns`}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Send Campaign
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
