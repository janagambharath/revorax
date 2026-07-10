'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi, membersApi } from '@/lib/api';
import { daysUntil, formatCurrency, formatDate, getVerticalPack } from '@revorax/shared';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid as RechartsCartesianGrid,
  Cell as RechartsCell,
  Pie as RechartsPie,
  PieChart as RechartsPieChart,
  ResponsiveContainer as RechartsResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
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
  const recovery = m?.recovery || {};
  const pack = getVerticalPack(org?.businessType);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{pack.dashboardTitle}</h1>
          <p className="text-zinc-500 text-sm mt-1">{org?.name || 'Your Business'} - {pack.positioning}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/members" className="btn-secondary text-sm flex items-center gap-2">
            <Users className="w-4 h-4" /> {pack.primaryNavLabel}
          </Link>
          <Link href="/dashboard/campaigns" className="btn-primary text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" /> New Campaign
          </Link>
        </div>
      </div>

      {(m?.members?.expiringThisWeek > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-amber-300 font-medium text-sm">
              {m.members.expiringThisWeek} {pack.primaryEntityPlural} need action this week
            </p>
            <p className="text-amber-400/70 text-xs">{pack.positioning}</p>
          </div>
          <Link href="/dashboard/members" className="btn-secondary text-xs py-1.5 px-3 shrink-0">
            View {pack.primaryNavLabel} {'>'}
          </Link>
        </div>
      )}

      {(recovery.revenueAtRisk > 0) && (
        <div className="grid md:grid-cols-[1fr_auto] gap-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div>
            <p className="text-red-300 font-semibold text-sm">
              {formatCurrency(recovery.revenueAtRisk)} revenue at risk
            </p>
            <p className="text-red-400/70 text-xs mt-1">
              {formatCurrency(recovery.overdueRevenue || 0)} overdue and {formatCurrency(recovery.expiringRevenue || 0)} in this week's action list
            </p>
          </div>
          <Link href="/dashboard/members" className="btn-secondary text-xs py-1.5 px-3 flex items-center justify-center gap-2">
            Open Recovery List <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={pack.activeLabel}
          value={metricsLoading ? '-' : m?.members?.active || 0}
          sub={`${m?.members?.trial || 0} ${pack.trialLabel}`}
          icon={Users}
          trend={{ value: 'vs last month', up: true }}
          href="/dashboard/members?status=ACTIVE"
        />
        <StatCard
          label="Revenue This Month"
          value={metricsLoading ? '-' : formatCurrency(m?.revenue?.thisMonth || 0)}
          icon={TrendingUp}
          trend={{ value: `${m?.revenue?.renewalRate || 0}% ${pack.retentionMetricLabel}`, up: (m?.revenue?.renewalRate || 0) > 70 }}
        />
        <StatCard
          label="Revenue Recovered"
          value={metricsLoading ? '—' : formatCurrency(m?.revenue?.recovered || 0)}
          sub="via Revorax AI"
          icon={Zap}
        />
        <StatCard
          label="Revenue At Risk"
          value={metricsLoading ? '-' : formatCurrency(recovery?.revenueAtRisk || 0)}
          sub={`${recovery?.followUpsDue || 0} follow-ups due`}
          icon={AlertCircle}
          href="/dashboard/members"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Monthly Revenue</h3>
          {revenueChart && (
            <RechartsResponsiveContainer width="100%" height={220}>
              <RechartsAreaChart data={revenueChart} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <RechartsCartesianGrid strokeDasharray="3 3" stroke="#2d2d45" vertical={false} />
                <RechartsXAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <RechartsYAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `Rs ${(Number(value) / 1000).toFixed(0)}k`} />
                <RechartsTooltip
                  contentStyle={{ background: '#1a1a24', border: '1px solid #2d2d45', borderRadius: '12px', color: '#f4f4f5' }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#revenueGrad)" />
              </RechartsAreaChart>
            </RechartsResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">{pack.primaryNavLabel} Status</h3>
          {memberStatus && (
            <>
              <RechartsResponsiveContainer width="100%" height={160}>
                <RechartsPieChart>
                  <RechartsPie data={memberStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="count" paddingAngle={3}>
                    {(memberStatus as any[]).map((entry: any, index: number) => (
                      <RechartsCell key={index} fill={STATUS_COLORS[entry.status] || '#6b7280'} />
                    ))}
                  </RechartsPie>
                  <RechartsTooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2d2d45', borderRadius: '12px', color: '#f4f4f5' }} />
                </RechartsPieChart>
              </RechartsResponsiveContainer>
              <div className="space-y-2 mt-2">
                {(memberStatus as any[]).map((status: any) => (
                  <div key={status.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[status.status] || '#6b7280' }} />
                      <span className="text-zinc-400">{MEMBER_STATUS_LABELS[status.status] || status.status}</span>
                    </div>
                    <span className="text-zinc-300 font-medium">{status.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-300">{pack.expiringLabel}</h3>
            <Link href="/dashboard/members" className="text-xs text-brand-400 hover:text-brand-300">View all {'>'}</Link>
          </div>
          {!expiring || expiring.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400 mb-3" />
              <p className="text-zinc-400 text-sm">No {pack.primaryEntityPlural} need action this week</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(expiring as any[]).slice(0, 5).map((member: any) => {
                const days = daysUntil(member.renewalDate);
                return (
                  <Link key={member.id} href={`/dashboard/members/${member.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-100 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
                      {member.contact.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{member.contact.name}</p>
                      <p className="text-xs text-zinc-500">{pack.retentionObject} - {formatCurrency(Number(member.amount))}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${days <= 3 ? 'text-red-400' : 'text-amber-400'}`}>
                        {days === 0 ? 'Today' : `${days}d`}
                      </p>
                      <p className="text-xs text-zinc-600">{formatDate(member.renewalDate)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-300">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {!activity || activity.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">No recent activity</p>
            ) : (
              (activity as any[]).slice(0, 8).map((item: any, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    item.type === 'message' ? 'bg-blue-500/20' : item.type === 'payment' ? 'bg-emerald-500/20' : 'bg-brand-500/20'
                  }`}>
                    {item.type === 'message' ? <MessageSquare className="w-3 h-3 text-blue-400" /> :
                     item.type === 'payment' ? <TrendingUp className="w-3 h-3 text-emerald-400" /> :
                     <Users className="w-3 h-3 text-brand-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300 truncate">{item.text}</p>
                    <p className="text-xs text-zinc-600 mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(item.at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
