'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/lib/api';
import { formatCurrency, formatDate, daysUntil } from '@revorax/shared';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Search, Plus, Filter, Users, AlertCircle, Clock,
  CheckCircle, ChevronRight, Phone, MessageSquare, RefreshCw,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'Active', cls: 'badge-green' },
  TRIAL: { label: 'Trial', cls: 'badge-blue' },
  EXPIRED: { label: 'Expired', cls: 'badge-red' },
  FROZEN: { label: 'Frozen', cls: 'badge-yellow' },
  CANCELLED: { label: 'Cancelled', cls: 'badge-gray' },
};

const MEMBERSHIP_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half Yearly',
  ANNUAL: 'Annual',
  DAY_PASS: 'Day Pass',
  CUSTOM: 'Custom',
};

export default function MembersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'expiring' | 'overdue' | 'reactivation'>('all');

  const listQuery = useQuery({
    queryKey: ['members', 'list', search, statusFilter],
    queryFn: () => membersApi.list({ search: search || undefined, status: statusFilter || undefined }) as any,
  });

  const expiringQuery = useQuery({
    queryKey: ['members', 'expiring'],
    queryFn: () => membersApi.expiringSoon(7) as any,
    enabled: activeTab === 'expiring',
  });

  const overdueQuery = useQuery({
    queryKey: ['members', 'overdue'],
    queryFn: () => membersApi.overdue() as any,
    enabled: activeTab === 'overdue',
  });

  const reactivationQuery = useQuery({
    queryKey: ['members', 'reactivation'],
    queryFn: () => membersApi.reactivation() as any,
    enabled: activeTab === 'reactivation',
  });

  const members = activeTab === 'all'
    ? listQuery.data?.data || []
    : activeTab === 'expiring'
    ? expiringQuery.data || []
    : activeTab === 'overdue'
    ? overdueQuery.data || []
    : reactivationQuery.data || [];

  const isLoading = activeTab === 'all' ? listQuery.isLoading :
    activeTab === 'expiring' ? expiringQuery.isLoading :
    activeTab === 'overdue' ? overdueQuery.isLoading : reactivationQuery.isLoading;

  const tabs = [
    { id: 'all', label: 'All Members', icon: Users, count: listQuery.data?.meta?.total },
    { id: 'expiring', label: 'Expiring Soon', icon: Clock, count: expiringQuery.data?.length, urgent: true },
    { id: 'overdue', label: 'Overdue', icon: AlertCircle, count: overdueQuery.data?.length, urgent: true },
    { id: 'reactivation', label: 'Reactivation', icon: RefreshCw, count: reactivationQuery.data?.length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Members</h1>
          <p className="text-zinc-500 text-sm mt-1">Track memberships, renewals, and revenue</p>
        </div>
        <Link href="/dashboard/members/new" className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Member
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-surface-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab.urgent && tab.count > 0 ? 'bg-red-500/20 text-red-400' : 'bg-surface-300 text-zinc-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search and Filter (only for all tab) */}
      {activeTab === 'all' && (
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, email..."
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select w-40"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIAL">Trial</option>
            <option value="EXPIRED">Expired</option>
            <option value="FROZEN">Frozen</option>
          </select>
        </div>
      )}

      {/* Members Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-zinc-600 mb-4" />
            <p className="text-zinc-400 font-medium">No members found</p>
            <p className="text-zinc-600 text-sm mt-1">
              {activeTab === 'all' ? 'Add your first member to get started' : 'No members in this category'}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Membership</th>
                <th>Renewal Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Last Contact</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m: any) => {
                const days = daysUntil(m.renewalDate);
                const statusConfig = STATUS_CONFIG[m.status] || STATUS_CONFIG.ACTIVE;
                return (
                  <tr key={m.id} className="cursor-pointer">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-sm font-bold shrink-0">
                          {m.contact?.name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-100 text-sm">{m.contact?.name}</p>
                          <p className="text-xs text-zinc-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {m.contact?.phone || 'No phone'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-zinc-300">{MEMBERSHIP_LABELS[m.membershipType] || m.membershipType}</span>
                    </td>
                    <td>
                      <div>
                        <p className="text-sm text-zinc-300">{formatDate(m.renewalDate)}</p>
                        {m.status !== 'CANCELLED' && (
                          <p className={`text-xs font-medium ${
                            days < 0 ? 'text-red-400' :
                            days <= 3 ? 'text-amber-400' :
                            days <= 7 ? 'text-yellow-400' : 'text-zinc-500'
                          }`}>
                            {days < 0 ? `${Math.abs(days)}d overdue` :
                             days === 0 ? 'Expires today' :
                             `${days}d left`}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-zinc-200">{formatCurrency(Number(m.amount))}</span>
                    </td>
                    <td>
                      <span className={statusConfig.cls}>{statusConfig.label}</span>
                    </td>
                    <td>
                      <span className="text-xs text-zinc-500">
                        {m.lastContactedAt ? formatDate(m.lastContactedAt) : 'Never'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); toast.info('Send message: coming soon'); }}
                          className="p-1.5 rounded-lg hover:bg-surface-200 text-zinc-500 hover:text-brand-400 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/dashboard/members/${m.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg hover:bg-surface-200 text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {activeTab === 'all' && listQuery.data?.meta && (
          <div className="px-4 py-3 border-t border-surface-200 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Showing {members.length} of {listQuery.data.meta.total} members
            </p>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs py-1.5 px-3" disabled={!listQuery.data.meta.hasPrev}>
                Previous
              </button>
              <button className="btn-secondary text-xs py-1.5 px-3" disabled={!listQuery.data.meta.hasNext}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
