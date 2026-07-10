'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi, membersApi } from '@/lib/api';
import { formatCurrency, formatDate, daysUntil } from '@revorax/shared';
import {
  TrendingUp, TrendingDown, Users, AlertCircle, Calendar,
  CheckCircle, Zap, ArrowRight, Clock, MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useAuthStore } from '@/stores/auth.store';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#10b981',
  TRIAL: '#3b82f6',
  EXPIRED: '#ef4444',
  FROZEN: '#f59e0b',
  CANCELLED: '#6b7280',
};

const MEMBER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  TRIAL: 'Trial',
  EXPIRED: 'Expired',
  FROZEN: 'Frozen',
  CANCELLED: 'Cancelled',
};

function StatCard({ label, value, sub, icon: Icon, trend, href }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  trend?: { value: string; up: boolean };
  href?: string;
}) {
  const card = (
    <div className="stat-card card-hover group">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value mt-1">{value}</p>
          {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
          {trend && (
            <div className={trend.up ? 'stat-change-up mt-2' : 'stat-change-down mt-2'}>
              {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend.value}
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand-400" />
        </div>
      </div>
      {href && (
        <div className="mt-3 text-xs text-zinc-500 group-hover:text-brand-400 transition-colors flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export default function DashboardPage() {
  const { org } = useAuthStore();

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsApi.dashboard() as any,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: revenueChart } = useQuery({
    queryKey: ['analytics', 'revenue-chart'],
    queryFn: () => analyticsApi.revenueChart(6) as any,
  });

  const { data: memberStatus } = useQuery({
    queryKey: ['analytics', 'member-status'],
    queryFn: () => analyticsApi.memberStatus() as any,
  });

  const { data: expiring } = useQuery({
    queryKey: ['members', 'expiring-soon'],
    queryFn: () => membersApi.expiringSoon(7) as any,
  });

  const { data: activity } = useQuery({
    queryKey: ['analytics', 'activity'],
    queryFn: () => analyticsApi.activity() as any,
  });

  const m = metrics as any;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Revenue Dashboard
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {org?.name || 'Your Business'} · {org?.businessType === 'GYM' ? 'Gym Revenue OS' : 'Revenue OS'}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/members" className="btn-secondary text-sm flex items-center gap-2">
            <Users className="w-4 h-4" /> Members
          </Link>
          <Link href="/dashboard/campaigns" className="btn-primary text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" /> New Campaign
          </Link>
        </div>
      </div>

      {/* Alert: Expiring soon */}
      {(m?.members?.expiringThisWeek > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-amber-300 font-medium text-sm">
              {m.members.expiringThisWeek} membership{m.members.expiringThisWeek !== 1 ? 's' : ''} expiring this week
            </p>
            <p className="text-amber-400/70 text-xs">Send renewal reminders now to prevent revenue loss</p>
          </div>
          <Link href="/dashboard/members?status=ACTIVE" className="btn-secondary text-xs py-1.5 px-3 shrink-0">
            View Members →
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Members"
          value={metricsLoading ? '—' : m?.members?.active || 0}
          sub={`${m?.members?.trial || 0} on trial`}
          icon={Users}
          trend={{ value: 'vs last month', up: true }}
          href="/dashboard/members?status=ACTIVE"
        />
        <StatCard
          label="Revenue This Month"
          value={metricsLoading ? '—' : formatCurrency(m?.revenue?.thisMonth || 0)}
          icon={TrendingUp}
          trend={{ value: `${m?.revenue?.renewalRate || 0}% renewal rate`, up: (m?.revenue?.renewalRate || 0) > 70 }}
        />
        <StatCard
          label="Expired / Overdue"
          value={metricsLoading ? '—' : m?.members?.expired || 0}
          sub="Need reactivation"
          icon={AlertCircle}
          href="/dashboard/members?status=EXPIRED"
        />
        <StatCard
          label="Expiring This Week"
          value={metricsLoading ? '—' : m?.members?.expiringThisWeek || 0}
          sub="Action required"
          icon={Calendar}
          href="/dashboard/members"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Monthly Revenue</h3>
          {revenueChart && (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueChart} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d45" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#1a1a24', border: '1px solid #2d2d45', borderRadius: '12px', color: '#f4f4f5' }}
                  formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Member Status Pie */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Member Status</h3>
          {memberStatus && (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={memberStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="count" paddingAngle={3}>
                    {(memberStatus as any[]).map((entry: any, index: number) => (
                      <Cell key={index} fill={STATUS_COLORS[entry.status] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2d2d45', borderRadius: '12px', color: '#f4f4f5' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {(memberStatus as any[]).map((s: any) => (
                  <div key={s.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s.status] || '#6b7280' }} />
                      <span className="text-zinc-400">{MEMBER_STATUS_LABELS[s.status] || s.status}</span>
                    </div>
                    <span className="text-zinc-300 font-medium">{s.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row: Expiring Soon + Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Expiring Soon */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-300">Expiring This Week</h3>
            <Link href="/dashboard/members" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          {!expiring || expiring.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400 mb-3" />
              <p className="text-zinc-400 text-sm">No members expiring this week</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(expiring as any[]).slice(0, 5).map((m: any) => {
                const days = daysUntil(m.renewalDate);
                return (
                  <Link key={m.id} href={`/dashboard/members/${m.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-100 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
                      {m.contact.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{m.contact.name}</p>
                      <p className="text-xs text-zinc-500">{m.membershipType} · {formatCurrency(Number(m.amount))}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${days <= 3 ? 'text-red-400' : 'text-amber-400'}`}>
                        {days === 0 ? 'Today' : `${days}d`}
                      </p>
                      <p className="text-xs text-zinc-600">{formatDate(m.renewalDate)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-300">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {!activity || activity.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">No recent activity</p>
            ) : (
              (activity as any[]).slice(0, 8).map((a: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    a.type === 'message' ? 'bg-blue-500/20' : a.type === 'payment' ? 'bg-emerald-500/20' : 'bg-brand-500/20'
                  }`}>
                    {a.type === 'message' ? <MessageSquare className="w-3 h-3 text-blue-400" /> :
                     a.type === 'payment' ? <TrendingUp className="w-3 h-3 text-emerald-400" /> :
                     <Users className="w-3 h-3 text-brand-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300 truncate">{a.text}</p>
                    <p className="text-xs text-zinc-600 mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(a.at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
