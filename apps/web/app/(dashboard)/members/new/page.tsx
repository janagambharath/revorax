'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi, membersApi } from '@/lib/api';
import { addMonths, formatCurrency, getRetentionOptions, getVerticalPack } from '@revorax/shared';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, Mail, Phone, Save, UserPlus, Wallet } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

type MemberForm = {
  name: string;
  phone: string;
  email: string;
  city: string;
  membershipType: string;
  status: string;
  startDate: string;
  renewalDate: string;
  amount: string;
  paidAmount: string;
  paymentMethod: string;
  goals: string;
  notes: string;
};

const STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'TRIAL', label: 'Trial' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'FROZEN', label: 'Frozen' },
];

const PAYMENT_METHODS = ['UPI', 'CASH', 'CARD', 'BANK_TRANSFER', 'RAZORPAY', 'OTHER'];

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toIsoDate(date: string) {
  return new Date(`${date}T00:00:00`).toISOString();
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function NewMemberPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { org } = useAuthStore();
  const pack = getVerticalPack(org?.businessType);
  const retentionOptions = getRetentionOptions(org?.businessType);
  const today = useMemo(() => new Date(), []);
  const [form, setForm] = useState<MemberForm>({
    name: '',
    phone: '',
    email: '',
    city: '',
    membershipType: 'MONTHLY',
    status: 'ACTIVE',
    startDate: toDateInput(today),
    renewalDate: toDateInput(addMonths(today, 1)),
    amount: '',
    paidAmount: '',
    paymentMethod: 'UPI',
    goals: '',
    notes: '',
  });

  const updateForm = (patch: Partial<MemberForm>) => setForm((current) => ({ ...current, ...patch }));

  const amount = Number(form.amount || 0);
  const paidAmount = Number(form.paidAmount || 0);
  const balance = Math.max(0, amount - paidAmount);

  const createMember = useMutation({
    mutationFn: async () => {
      const contact = await contactsApi.create({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        city: form.city.trim() || undefined,
        source: 'WALK_IN',
      }) as any;

      const member = await membersApi.create({
        contactId: contact.id,
        membershipType: form.membershipType,
        status: form.status,
        startDate: toIsoDate(form.startDate),
        renewalDate: toIsoDate(form.renewalDate),
        amount,
        goals: form.goals.trim() || undefined,
        notes: form.notes.trim() || undefined,
      }) as any;

      if (paidAmount > 0) {
        await membersApi.recordPayment({
          memberId: member.id,
          amount: paidAmount,
          method: form.paymentMethod,
        });
      }

      return member;
    },
    onSuccess: () => {
      toast.success(`${titleCase(pack.primaryEntity)} added`);
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      // Redirect to the list because detail workspace is specialized for members in V1
      router.push(`/dashboard/members`);
    },
    onError: () => toast.error(`Could not add ${pack.primaryEntity}`),
  });

  const canSubmit = form.name.trim().length > 1 && amount > 0 && Boolean(form.startDate) && Boolean(form.renewalDate);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/dashboard/members" className="text-sm text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-2 mb-3">
            <ArrowLeft className="w-4 h-4" /> {pack.primaryNavLabel}
          </Link>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-brand-400" />
            </div>
            Add {titleCase(pack.primaryEntity)}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Add a {pack.customerLabel}, {pack.retentionObject}, and {pack.retentionDateLabel}</p>
        </div>
        <button
          onClick={() => createMember.mutate()}
          disabled={!canSubmit || createMember.isPending}
          className="btn-primary text-sm flex items-center justify-center gap-2"
        >
            <Save className="w-4 h-4" /> Save {titleCase(pack.primaryEntity)}
        </button>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="space-y-6">
          <div className="card p-6 space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Contact</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <input value={form.name} onChange={(event) => updateForm({ name: event.target.value })} className="input" placeholder={`${titleCase(pack.primaryEntity)} name`} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input value={form.phone} onChange={(event) => updateForm({ phone: event.target.value })} className="input" placeholder="+91..." />
              </div>
              <div>
                <label className="label">Email</label>
                <input value={form.email} onChange={(event) => updateForm({ email: event.target.value })} className="input" placeholder="name@example.com" />
              </div>
              <div>
                <label className="label">City</label>
                <input value={form.city} onChange={(event) => updateForm({ city: event.target.value })} className="input" placeholder="City" />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">{titleCase(pack.retentionObject)}</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">{titleCase(pack.retentionObject)} Type</label>
                <select value={form.membershipType} onChange={(event) => updateForm({ membershipType: event.target.value })} className="select">
                  {retentionOptions.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={(event) => updateForm({ status: event.target.value })} className="select">
                  {STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Start Date</label>
                <input value={form.startDate} onChange={(event) => updateForm({ startDate: event.target.value })} type="date" className="input" />
              </div>
              <div>
                <label className="label">{titleCase(pack.retentionDateLabel)}</label>
                <input value={form.renewalDate} onChange={(event) => updateForm({ renewalDate: event.target.value })} type="date" className="input" />
              </div>
              <div>
                <label className="label">{titleCase(pack.amountLabel)}</label>
                <input value={form.amount} onChange={(event) => updateForm({ amount: event.target.value })} type="number" min="0" className="input" placeholder="2500" />
              </div>
              {org?.businessType === 'GYM' && (
                <>
                  <div>
                    <label className="label">Paid Now</label>
                    <input value={form.paidAmount} onChange={(event) => updateForm({ paidAmount: event.target.value })} type="number" min="0" className="input" placeholder="0" />
                  </div>
                  <div>
                    <label className="label">Payment Method</label>
                    <select value={form.paymentMethod} onChange={(event) => updateForm({ paymentMethod: event.target.value })} className="select">
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>{method.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Context</h2>
            </div>
            <div>
              <label className="label">Outcome Goal</label>
              <input value={form.goals} onChange={(event) => updateForm({ goals: event.target.value })} className="input" placeholder={pack.revenueGoal} />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea value={form.notes} onChange={(event) => updateForm({ notes: event.target.value })} className="input resize-none h-24 text-sm" placeholder={`Important ${pack.retentionObject} or follow-up notes`} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {org?.businessType === 'GYM' && (
            <div className="card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-zinc-200">Revenue Summary</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">{titleCase(pack.retentionObject)} value</span>
                  <span className="text-sm font-semibold text-zinc-200">{formatCurrency(amount || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Paid now</span>
                  <span className="text-sm font-semibold text-emerald-400">{formatCurrency(paidAmount || 0)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-surface-200 pt-4">
                  <span className="text-sm text-zinc-500">Remaining</span>
                  <span className={balance > 0 ? 'text-sm font-semibold text-amber-400' : 'text-sm font-semibold text-emerald-400'}>
                    {formatCurrency(balance)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200">Readiness</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-500 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> WhatsApp
                </span>
                <span className={form.phone.trim() ? 'badge-green' : 'badge-gray'}>
                  {form.phone.trim() ? 'Ready' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-500 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </span>
                <span className={form.email.trim() ? 'badge-green' : 'badge-gray'}>
                  {form.email.trim() ? 'Ready' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-500 flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Payment
                </span>
                <span className={balance > 0 ? 'badge-yellow' : amount > 0 ? 'badge-green' : 'badge-gray'}>
                  {amount > 0 ? (balance > 0 ? 'Pending' : 'Paid') : 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-500 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> {titleCase(pack.retentionObject)}
                </span>
                <span className={form.renewalDate ? 'badge-green' : 'badge-gray'}>
                  {form.renewalDate ? 'Set' : 'Missing'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
