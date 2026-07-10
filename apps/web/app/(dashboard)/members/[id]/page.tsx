'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiApi, membersApi, messagesApi } from '@/lib/api';
import { daysUntil, formatCurrency, formatDate, formatRelative, getRetentionOptions, getVerticalPack } from '@revorax/shared';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Mail,
  Phone,
  RefreshCw,
  Send,
  Sparkles,
  User,
  Wallet,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

type Channel = 'WHATSAPP' | 'EMAIL';

type MemberDetail = {
  id: string;
  contactId: string;
  membershipType: string;
  status: string;
  renewalDate: string;
  startDate: string;
  amount: string | number;
  paidAmount: string | number;
  followUpStatus: string;
  lastContactedAt?: string | null;
  notes?: string | null;
  goals?: string | null;
  contact: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    city?: string | null;
    messages?: Array<{
      id: string;
      body: string;
      channel: string;
      direction: string;
      status: string;
      createdAt: string;
    }>;
    notesList?: Array<{
      id: string;
      body: string;
      createdAt: string;
      createdBy?: { name: string };
    }>;
    tasks?: Array<{
      id: string;
      title: string;
      priority: string;
      status: string;
      dueAt?: string | null;
    }>;
  };
  payments?: Array<{
    id: string;
    amount: string | number;
    status: string;
    method: string;
    paidAt?: string | null;
    createdAt: string;
  }>;
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'Active', cls: 'badge-green' },
  TRIAL: { label: 'Trial', cls: 'badge-blue' },
  EXPIRED: { label: 'Expired', cls: 'badge-red' },
  FROZEN: { label: 'Frozen', cls: 'badge-yellow' },
  CANCELLED: { label: 'Cancelled', cls: 'badge-gray' },
};

const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'RAZORPAY', 'OTHER'];

function getStatusText(days: number) {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  return `${days}d left`;
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { org } = useAuthStore();
  const pack = getVerticalPack(org?.businessType);
  const retentionLabels = Object.fromEntries(
    getRetentionOptions(org?.businessType).map((option) => [option.value, option.label]),
  );
  const memberId = params.id;
  const [channel, setChannel] = useState<Channel>('WHATSAPP');
  const [context, setContext] = useState('');
  const [draft, setDraft] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const { data: member, isLoading } = useQuery({
    queryKey: ['members', memberId],
    queryFn: () => membersApi.get(memberId) as unknown as Promise<MemberDetail>,
  });

  const days = member ? daysUntil(member.renewalDate) : 0;
  const amount = Number(member?.amount || 0);
  const paidAmount = Number(member?.paidAmount || 0);
  const balance = Math.max(0, amount - paidAmount);
  const revenueAtRisk = member && member.status !== 'CANCELLED' && days <= 7 ? amount : 0;
  const statusConfig = member ? STATUS_CONFIG[member.status] || STATUS_CONFIG.ACTIVE : STATUS_CONFIG.ACTIVE;
  const canSend = Boolean(
    member &&
      draft.trim() &&
      (channel === 'WHATSAPP' ? member.contact.phone : member.contact.email),
  );

  const recoveryContext = useMemo(() => {
    if (!member) return '';
    return [
      `${member.contact.name} is a ${retentionLabels[member.membershipType] || member.membershipType} ${pack.customerLabel}.`,
      `${titleCase(pack.retentionObject)} status: ${member.status}.`,
      `${titleCase(pack.retentionDateLabel)}: ${formatDate(member.renewalDate)} (${getStatusText(days)}).`,
      `${titleCase(pack.amountLabel)}: ${formatCurrency(amount)}.`,
      balance > 0 ? `Balance to collect: ${formatCurrency(balance)}.` : 'Payment is already fully recorded.',
      member.goals ? `Outcome goal: ${member.goals}.` : '',
      member.notes ? `Staff notes: ${member.notes}.` : '',
    ].filter(Boolean).join(' ');
  }, [amount, balance, days, member, pack, retentionLabels]);

  const generateFollowUp = useMutation({
    mutationFn: () => {
      if (!member) throw new Error('Member not loaded');
      return aiApi.followUp({
        contactId: member.contactId,
        channel,
        context: context.trim() || recoveryContext,
      });
    },
    onSuccess: (data: any) => {
      setDraft(data.suggestion || '');
      toast.success('Follow-up drafted');
    },
    onError: () => toast.error('AI follow-up failed'),
  });

  const sendMessage = useMutation({
    mutationFn: () => {
      if (!member) throw new Error('Member not loaded');
      if (channel === 'WHATSAPP') {
        return messagesApi.sendWhatsApp({ contactId: member.contactId, body: draft.trim() });
      }
      return messagesApi.sendEmail({
        contactId: member.contactId,
        subject: `${titleCase(pack.retentionObject)} follow-up`,
        body: draft.trim(),
      });
    },
    onSuccess: () => {
      toast.success('Follow-up sent');
      qc.invalidateQueries({ queryKey: ['members', memberId] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: () => toast.error('Message sending failed'),
  });

  const markFollowUp = useMutation({
    mutationFn: () => membersApi.markFollowUp(memberId),
    onSuccess: () => {
      toast.success('Follow-up marked done');
      qc.invalidateQueries({ queryKey: ['members', memberId] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: () => toast.error('Could not update follow-up'),
  });

  const recordPayment = useMutation({
    mutationFn: () => {
      const fallbackAmount = balance || amount;
      return membersApi.recordPayment({
        memberId,
        amount: Number(paymentAmount || fallbackAmount),
        method: paymentMethod,
      });
    },
    onSuccess: () => {
      toast.success('Payment recorded');
      setPaymentAmount('');
      qc.invalidateQueries({ queryKey: ['members', memberId] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: () => toast.error('Could not record payment'),
  });

  if (isLoading || !member) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const messages = member.contact.messages || [];
  const notes = member.contact.notesList || [];
  const tasks = member.contact.tasks || [];
  const payments = member.payments || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/dashboard/members" className="text-sm text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-2 mb-3">
            <ArrowLeft className="w-4 h-4" /> {pack.primaryNavLabel}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-300 font-bold">
              {member.contact.name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">{member.contact.name}</h1>
              <p className="text-sm text-zinc-500">
                {retentionLabels[member.membershipType] || member.membershipType} {pack.retentionObject}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => generateFollowUp.mutate()}
            disabled={generateFollowUp.isPending}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            {generateFollowUp.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Draft Follow-up
          </button>
          <button
            onClick={() => markFollowUp.mutate()}
            disabled={markFollowUp.isPending}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> Mark Contacted
          </button>
        </div>
      </div>

      {revenueAtRisk > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex flex-col gap-3 md:flex-row md:items-center">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-red-300 font-medium text-sm">
              {formatCurrency(revenueAtRisk)} at risk from this {pack.retentionObject}
            </p>
            <p className="text-red-400/70 text-xs">
              {getStatusText(days)}. Follow up now or record the recovered revenue.
            </p>
          </div>
          <button
            onClick={() => recordPayment.mutate()}
            disabled={recordPayment.isPending}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center justify-center gap-2"
          >
            <CreditCard className="w-3.5 h-3.5" /> Record Recovery
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="stat-label">{titleCase(pack.retentionDateLabel)}</p>
          <p className="stat-value text-lg">{formatDate(member.renewalDate)}</p>
          <p className={days < 0 ? 'text-xs text-red-400' : days <= 7 ? 'text-xs text-amber-400' : 'text-xs text-zinc-500'}>
            {getStatusText(days)}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">{titleCase(pack.amountLabel)}</p>
          <p className="stat-value text-lg">{formatCurrency(amount)}</p>
          <p className="text-xs text-zinc-500">{balance > 0 ? `${formatCurrency(balance)} pending` : 'Fully recorded'}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Status</p>
          <div className="mt-2"><span className={statusConfig.cls}>{statusConfig.label}</span></div>
          <p className="text-xs text-zinc-500 mt-2">Follow-up: {member.followUpStatus.toLowerCase()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Last Contact</p>
          <p className="stat-value text-lg">
            {member.lastContactedAt ? formatRelative(member.lastContactedAt) : 'Never'}
          </p>
          <p className="text-xs text-zinc-500">Contact attempts should stay visible</p>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.35fr_0.9fr] gap-6">
        <div className="space-y-6">
          <div className="card p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-200">Follow-up Workspace</h2>
                <p className="text-xs text-zinc-500 mt-1">Draft, send, and track this {pack.retentionObject} conversation</p>
              </div>
              <div className="flex gap-2">
                {(['WHATSAPP', 'EMAIL'] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setChannel(item)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      channel === item
                        ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                        : 'border-surface-300 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {item === 'WHATSAPP' ? 'WhatsApp' : 'Email'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Context</label>
              <textarea
                value={context}
                onChange={(event) => setContext(event.target.value)}
                placeholder={recoveryContext}
                className="input resize-none h-24 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Message Draft</label>
                <button
                  onClick={() => generateFollowUp.mutate()}
                  disabled={generateFollowUp.isPending}
                  className="text-xs text-brand-400 hover:text-brand-300 inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Generate
                </button>
              </div>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={pack.campaignPlaceholder}
                className="input resize-none h-40 text-sm"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-500">
                {channel === 'WHATSAPP'
                  ? member.contact.phone || 'No phone number on this contact'
                  : member.contact.email || 'No email address on this contact'}
              </p>
              <button
                onClick={() => sendMessage.mutate()}
                disabled={!canSend || sendMessage.isPending}
                className="btn-primary text-sm flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Send {channel === 'WHATSAPP' ? 'WhatsApp' : 'Email'}
              </button>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-200">Record Payment</h2>
              <span className="badge-green">{formatCurrency(balance || amount)} target</span>
            </div>
            <div className="grid md:grid-cols-[1fr_180px_auto] gap-3">
              <input
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
                type="number"
                min="0"
                placeholder={`${balance || amount}`}
                className="input"
              />
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="select">
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>{method.replace('_', ' ')}</option>
                ))}
              </select>
              <button
                onClick={() => recordPayment.mutate()}
                disabled={recordPayment.isPending}
                className="btn-primary text-sm flex items-center justify-center gap-2"
              >
                <Wallet className="w-4 h-4" /> Record
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-200">
              <h2 className="text-sm font-semibold text-zinc-200">Payment History</h2>
            </div>
            {payments.length === 0 ? (
              <p className="text-sm text-zinc-500 px-6 py-8 text-center">No payments recorded yet</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{formatCurrency(Number(payment.amount))}</td>
                      <td>{payment.method.replace('_', ' ')}</td>
                      <td><span className={payment.status === 'PAID' ? 'badge-green' : 'badge-yellow'}>{payment.status}</span></td>
                      <td>{formatDate(payment.paidAt || payment.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200">{titleCase(pack.primaryEntity)} Profile</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-zinc-400">
                <User className="w-4 h-4 text-zinc-500" />
                <span>{member.contact.name}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-400">
                <Phone className="w-4 h-4 text-zinc-500" />
                <span>{member.contact.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-400">
                <Mail className="w-4 h-4 text-zinc-500" />
                <span>{member.contact.email || 'No email'}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-400">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <span>Added {formatDate(member.startDate)}</span>
              </div>
            </div>
            {member.goals && (
              <div className="pt-4 border-t border-surface-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Outcome Goal</p>
                <p className="text-sm text-zinc-300">{member.goals}</p>
              </div>
            )}
            {member.notes && (
              <div className="pt-4 border-t border-surface-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Notes</p>
                <p className="text-sm text-zinc-300">{member.notes}</p>
              </div>
            )}
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200">Open Tasks</h2>
            {tasks.length === 0 ? (
              <p className="text-sm text-zinc-500">No open tasks</p>
            ) : (
              tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-start gap-3 border-b border-surface-200 pb-3 last:border-0 last:pb-0">
                  <Clock className="w-4 h-4 text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-zinc-300">{task.title}</p>
                    <p className="text-xs text-zinc-500">{task.priority} priority{task.dueAt ? `, due ${formatDate(task.dueAt)}` : ''}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200">Recent Messages</h2>
            {messages.length === 0 ? (
              <p className="text-sm text-zinc-500">No messages yet</p>
            ) : (
              messages.slice(0, 6).map((message) => (
                <div key={message.id} className="border-b border-surface-200 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className={message.direction === 'OUTBOUND' ? 'badge-blue' : 'badge-green'}>
                      {message.direction.toLowerCase()}
                    </span>
                    <span className="text-xs text-zinc-600">{formatRelative(message.createdAt)}</span>
                  </div>
                  <p className="text-sm text-zinc-300 line-clamp-3">{message.body}</p>
                </div>
              ))
            )}
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200">Recent Notes</h2>
            {notes.length === 0 ? (
              <p className="text-sm text-zinc-500">No notes yet</p>
            ) : (
              notes.slice(0, 5).map((note) => (
                <div key={note.id} className="border-b border-surface-200 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm text-zinc-300">{note.body}</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    {note.createdBy?.name || 'Team'} on {formatDate(note.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
