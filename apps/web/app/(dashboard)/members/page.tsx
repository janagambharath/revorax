'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { membersApi, patientsApi, clientsApi } from '@/lib/api';
import { formatCurrency, formatDate, daysUntil, getRetentionOptions, getVerticalPack } from '@revorax/shared';
import Link from 'next/link';
import {
  Search, Plus, Users, AlertCircle, Clock,
  ChevronRight, Phone, MessageSquare, RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'Active', cls: 'badge-green' },
  TRIAL: { label: 'Trial', cls: 'badge-blue' },
  EXPIRED: { label: 'Expired', cls: 'badge-red' },
  FROZEN: { label: 'Frozen', cls: 'badge-yellow' },
  CANCELLED: { label: 'Cancelled', cls: 'badge-gray' },
};

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function MembersPage() {
  const { org } = useAuthStore();
  const qc = useQueryClient();
  const businessType = org?.businessType || 'GYM';
  const pack = getVerticalPack(org?.businessType);
  const retentionLabels = Object.fromEntries(
    getRetentionOptions(org?.businessType).map((option) => [option.value, option.label]),
  );
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'expiring' | 'overdue' | 'reactivation'>('all');

  const api = businessType === 'CLINIC'
    ? patientsApi
    : businessType === 'SALON'
    ? clientsApi
    : membersApi;

  const listQuery = useQuery({
    queryKey: ['members', 'list', search, statusFilter],
    queryFn: () => api.list({ search: search || undefined, status: statusFilter || undefined }) as any,
  });

  const expiringQuery = useQuery({
    queryKey: ['members', 'expiring'],
    queryFn: () => {
      if (businessType === 'CLINIC' || businessType === 'SALON') {
        return api.scheduledReminders(7) as any;
      }
      return membersApi.expiringSoon(7) as any;
    },
    enabled: activeTab === 'expiring',
  });

  const overdueQuery = useQuery({
    queryKey: ['members', 'overdue'],
    queryFn: () => {
      if (businessType === 'CLINIC') {
        return patientsApi.recalls() as any;
      }
      if (businessType === 'SALON') {
        return clientsApi.lapsed() as any;
      }
      return membersApi.overdue() as any;
    },
    enabled: activeTab === 'overdue',
  });

  const reactivationQuery = useQuery({
    queryKey: ['members', 'reactivation'],
    queryFn: () => {
      if (businessType === 'CLINIC') {
        return patientsApi.recalls() as any;
      }
      if (businessType === 'SALON') {
        return clientsApi.lapsed() as any;
      }
      return membersApi.reactivation() as any;
    },
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
    { id: 'all', label: `All ${pack.primaryNavLabel}`, icon: Users, count: listQuery.data?.meta?.total },
    { id: 'expiring', label: pack.expiringLabel, icon: Clock, count: expiringQuery.data?.length, urgent: true },
    { id: 'overdue', label: pack.overdueLabel, icon: AlertCircle, count: overdueQuery.data?.length, urgent: true },
    { id: 'reactivation', label: pack.reactivationLabel, icon: RefreshCw, count: reactivationQuery.data?.length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{pack.primaryNavLabel}</h1>
          <p className="text-zinc-500 text-sm mt-1">{pack.recoveryListLabel}: {pack.positioning}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="btn-secondary text-sm flex items-center gap-2 cursor-pointer">
            <RefreshCw className="w-4 h-4" /> Import CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (evt) => {
                  try {
                    const text = evt.target?.result as string;
                    const lines = text.split('\n').filter(Boolean);
                    if (lines.length < 2) throw new Error('File is empty or missing headers');
                    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
                    
                    const nameIdx = headers.findIndex(h => h.includes('name'));
                    const phoneIdx = headers.findIndex(h => h.includes('phone'));
                    const emailIdx = headers.findIndex(h => h.includes('email'));
                    const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('spend') || h.includes('value'));
                    const renewalIdx = headers.findIndex(h => h.includes('renewal') || h.includes('appointment') || h.includes('visit') || h.includes('date'));
                    
                    if (nameIdx === -1 || phoneIdx === -1) {
                      throw new Error('CSV must contain Name and Phone columns');
                    }

                    const payload = lines.slice(1).map(line => {
                      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
                      if (!values[nameIdx] || !values[phoneIdx]) return null;
                      
                      if (businessType === 'CLINIC') {
                        return {
                          name: values[nameIdx],
                          phone: values[phoneIdx],
                          email: emailIdx !== -1 ? values[emailIdx] : undefined,
                          lastAppointmentDate: renewalIdx !== -1 ? values[renewalIdx] : new Date().toISOString(),
                          treatmentValue: amountIdx !== -1 ? parseFloat(values[amountIdx]) : 0,
                        };
                      }
                      if (businessType === 'SALON') {
                        return {
                          name: values[nameIdx],
                          phone: values[phoneIdx],
                          email: emailIdx !== -1 ? values[emailIdx] : undefined,
                          lastVisitDate: renewalIdx !== -1 ? values[renewalIdx] : new Date().toISOString(),
                          averageSpend: amountIdx !== -1 ? parseFloat(values[amountIdx]) : 0,
                          visitCount: 1,
                        };
                      }
                      return {
                        name: values[nameIdx],
                        phone: values[phoneIdx],
                        email: emailIdx !== -1 ? values[emailIdx] : undefined,
                        renewalDate: renewalIdx !== -1 ? values[renewalIdx] : new Date().toISOString(),
                        amount: amountIdx !== -1 ? values[amountIdx] : 0,
                        membershipType: 'MONTHLY'
                      };
                    }).filter(Boolean);

                    const res = await (
                      businessType === 'CLINIC'
                        ? patientsApi.importCsv(payload)
                        : businessType === 'SALON'
                        ? clientsApi.importCsv(payload)
                        : membersApi.importCsv(payload)
                    ) as any;
                    toast.success(`Imported ${res.count} ${pack.primaryEntityPlural} successfully`);
                    qc.invalidateQueries({ queryKey: ['members'] });
                  } catch (err: any) {
                    toast.error(err?.message || 'Failed to parse CSV');
                  }
                  e.target.value = '';
                };
                reader.readAsText(file);
              }}
            />
          </label>
          <Link href="/dashboard/members/new" className="btn-primary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add {titleCase(pack.primaryEntity)}
          </Link>
        </div>
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
              placeholder={`Search ${pack.primaryEntityPlural} by name, phone, email...`}
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
            <p className="text-zinc-400 font-medium">No {pack.primaryEntityPlural} found</p>
            <p className="text-zinc-600 text-sm mt-1">
              {activeTab === 'all' ? `Add your first ${pack.primaryEntity} to get started` : `No ${pack.primaryEntityPlural} in this category`}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{titleCase(pack.primaryEntity)}</th>
                <th>{titleCase(pack.retentionObject)}</th>
                <th>{titleCase(pack.retentionDateLabel)}</th>
                <th>{titleCase(pack.amountLabel)}</th>
                <th>Status</th>
                <th>Last Contact</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m: any) => {
                const dateVal = businessType === 'CLINIC'
                  ? m.nextAppointmentDate || m.lastAppointmentDate
                  : businessType === 'SALON'
                  ? m.nextBookingDate || m.lastVisitDate
                  : m.renewalDate;

                const amountVal = businessType === 'CLINIC'
                  ? m.treatmentValue
                  : businessType === 'SALON'
                  ? m.averageSpend
                  : m.amount;

                const retentionText = businessType === 'CLINIC'
                  ? (m.nextAppointmentDate ? 'Appointment' : 'Recall Due')
                  : businessType === 'SALON'
                  ? `Average Spend`
                  : (retentionLabels[m.membershipType] || m.membershipType);

                const days = dateVal ? daysUntil(dateVal) : 0;
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
                      <span className="text-sm text-zinc-300">{retentionText}</span>
                    </td>
                    <td>
                      <div>
                        <p className="text-sm text-zinc-300">{dateVal ? formatDate(dateVal) : '-'}</p>
                        {m.status !== 'CANCELLED' && dateVal && (
                          <p className={`text-xs font-medium ${
                            days < 0 ? 'text-red-400' :
                            days <= 3 ? 'text-amber-400' :
                            days <= 7 ? 'text-yellow-400' : 'text-zinc-500'
                          }`}>
                            {days < 0 ? `${Math.abs(days)}d overdue` :
                             days === 0 ? 'Due today' :
                             `${days}d left`}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-zinc-200">{formatCurrency(Number(amountVal || 0))}</span>
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
                        <Link
                          href={`/dashboard/members/${m.id}`}
                          title="Open follow-up workspace"
                          className="p-1.5 rounded-lg hover:bg-surface-200 text-zinc-500 hover:text-brand-400 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Link>
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
              Showing {members.length} of {listQuery.data.meta.total} {pack.primaryEntityPlural}
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
