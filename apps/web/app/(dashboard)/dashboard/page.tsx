'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi, membersApi, patientsApi, clientsApi } from '@/lib/api';
import { daysUntil, formatCurrency, formatDate, getVerticalPack } from '@revorax/shared';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  MessageSquare,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
  CalendarClock,
  CreditCard,
  UserMinus,
  Target,
  Building2,
  FileText,
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

// ─── Niche-Specific KPI Configurations ───────────────────────────────────────

type NicheKPIs = {
  statCards: Array<{
    key: string;
    label: string;
    valueKey: string;
    subKey?: string;
    subLabel?: string;
    icon: React.ElementType;
    trendLabel?: string;
    href?: string;
  }>;
  urgencyAlert: {
    metricKey: string;
    message: (count: number) => string;
    subMessage: string;
  };
  chartTitle: string;
  chartMetricLabel: string;
  quickActions: Array<{
    label: string;
    href: string;
    icon: React.ElementType;
    primary?: boolean;
  }>;
};

const NICHE_KPIS: Record<string, NicheKPIs> = {
  GYM: {
    statCards: [
      { key: 'active', label: 'Active Members', valueKey: 'members.active', subKey: 'members.trial', subLabel: 'on trial', icon: Users, trendLabel: 'vs last month', href: '/dashboard/members?status=ACTIVE' },
      { key: 'revenue', label: 'Revenue This Month', valueKey: 'revenue.thisMonth', icon: TrendingUp, trendLabel: 'renewal rate' },
      { key: 'recovered', label: 'Revenue Recovered', valueKey: 'revenue.recovered', icon: Zap, subLabel: 'via renewal reminders' },
      { key: 'atRisk', label: 'Revenue At Risk', valueKey: 'recovery.revenueAtRisk', subKey: 'recovery.followUpsDue', subLabel: 'renewals due', icon: AlertCircle, href: '/dashboard/members' },
    ],
    urgencyAlert: {
      metricKey: 'members.expiringThisWeek',
      message: (count) => `${count} memberships expiring this week`,
      subMessage: 'Send renewal reminders before they lapse',
    },
    chartTitle: 'Monthly Renewal Revenue',
    chartMetricLabel: 'Renewal Revenue',
    quickActions: [
      { label: 'Members', href: '/dashboard/members', icon: Users },
      { label: 'New Campaign', href: '/dashboard/campaigns', icon: Zap, primary: true },
    ],
  },
  CLINIC: {
    statCards: [
      { key: 'active', label: 'Active Patients', valueKey: 'members.active', subKey: 'members.trial', subLabel: 'new inquiries', icon: Users, href: '/dashboard/members?status=ACTIVE' },
      { key: 'appointments', label: 'Appointments This Week', valueKey: 'members.expiringThisWeek', icon: CalendarClock, trendLabel: 'show-up rate' },
      { key: 'recovered', label: 'Revenue Recovered', valueKey: 'revenue.recovered', icon: Zap, subLabel: 'via appointment recalls' },
      { key: 'recalls', label: 'Overdue Recalls', valueKey: 'recovery.followUpsDue', icon: UserMinus, href: '/dashboard/members' },
    ],
    urgencyAlert: {
      metricKey: 'members.expiringThisWeek',
      message: (count) => `${count} patient recalls overdue`,
      subMessage: 'Send automated appointment reminders to reduce no-shows',
    },
    chartTitle: 'Monthly Appointment Revenue',
    chartMetricLabel: 'Appointment Revenue',
    quickActions: [
      { label: 'Patients', href: '/dashboard/members', icon: Users },
      { label: 'Send Recalls', href: '/dashboard/campaigns', icon: CalendarClock, primary: true },
    ],
  },
  SALON: {
    statCards: [
      { key: 'active', label: 'Active Clients', valueKey: 'members.active', subKey: 'members.trial', subLabel: 'new clients', icon: Users, href: '/dashboard/members?status=ACTIVE' },
      { key: 'rebookings', label: 'Rebookings Due', valueKey: 'members.expiringThisWeek', icon: CalendarClock, trendLabel: 'repeat rate' },
      { key: 'recovered', label: 'Revenue Recovered', valueKey: 'revenue.recovered', icon: Zap, subLabel: 'via rebooking reminders' },
      { key: 'lapsed', label: 'Lapsed Clients', valueKey: 'recovery.followUpsDue', icon: UserMinus, href: '/dashboard/members' },
    ],
    urgencyAlert: {
      metricKey: 'members.expiringThisWeek',
      message: (count) => `${count} clients haven't returned in 3+ weeks`,
      subMessage: 'Send rebooking reminders to bring them back',
    },
    chartTitle: 'Monthly Repeat Revenue',
    chartMetricLabel: 'Repeat Revenue',
    quickActions: [
      { label: 'Clients', href: '/dashboard/members', icon: Users },
      { label: 'Rebooking Campaign', href: '/dashboard/campaigns', icon: CalendarClock, primary: true },
    ],
  },
  COACHING: {
    statCards: [
      { key: 'active', label: 'Active Students', valueKey: 'members.active', subKey: 'members.trial', subLabel: 'admission trials', icon: Users, href: '/dashboard/members?status=ACTIVE' },
      { key: 'fees', label: 'Fees Due This Week', valueKey: 'members.expiringThisWeek', icon: CreditCard, trendLabel: 'collection rate' },
      { key: 'recovered', label: 'Fees Collected', valueKey: 'revenue.recovered', icon: Zap, subLabel: 'via automated reminders' },
      { key: 'overdue', label: 'Overdue Fees', valueKey: 'recovery.revenueAtRisk', icon: AlertCircle, href: '/dashboard/members' },
    ],
    urgencyAlert: {
      metricKey: 'members.expiringThisWeek',
      message: (count) => `${count} fee payments overdue`,
      subMessage: 'Send fee reminders to parents and students',
    },
    chartTitle: 'Monthly Fee Collection',
    chartMetricLabel: 'Fee Revenue',
    quickActions: [
      { label: 'Students', href: '/dashboard/members', icon: Users },
      { label: 'Fee Reminder', href: '/dashboard/campaigns', icon: CreditCard, primary: true },
    ],
  },
  REAL_ESTATE: {
    statCards: [
      { key: 'active', label: 'Active Prospects', valueKey: 'members.active', subKey: 'members.trial', subLabel: 'new leads', icon: Users, href: '/dashboard/members?status=ACTIVE' },
      { key: 'visits', label: 'Visits This Week', valueKey: 'members.expiringThisWeek', icon: Building2, trendLabel: 'booking rate' },
      { key: 'pipeline', label: 'Pipeline Value', valueKey: 'revenue.thisMonth', icon: TrendingUp },
      { key: 'cold', label: 'Leads Going Cold', valueKey: 'recovery.followUpsDue', icon: Target, href: '/dashboard/members' },
    ],
    urgencyAlert: {
      metricKey: 'recovery.followUpsDue',
      message: (count) => `${count} leads going cold — no follow-up in 3+ days`,
      subMessage: 'Send qualification messages before they move on',
    },
    chartTitle: 'Monthly Deal Pipeline',
    chartMetricLabel: 'Pipeline Value',
    quickActions: [
      { label: 'Prospects', href: '/dashboard/members', icon: Users },
      { label: 'Qualify Leads', href: '/dashboard/campaigns', icon: Target, primary: true },
    ],
  },
  DENTAL: {
    statCards: [
      { key: 'active', label: 'Active Patients', valueKey: 'members.active', subKey: 'members.trial', subLabel: 'new patients', icon: Users, href: '/dashboard/members?status=ACTIVE' },
      { key: 'recalls', label: 'Recalls This Week', valueKey: 'members.expiringThisWeek', icon: CalendarClock, trendLabel: 'completion rate' },
      { key: 'recovered', label: 'Revenue Recovered', valueKey: 'revenue.recovered', icon: Zap, subLabel: 'via recall reminders' },
      { key: 'treatment', label: 'Pending Treatments', valueKey: 'recovery.followUpsDue', icon: FileText, href: '/dashboard/members' },
    ],
    urgencyAlert: {
      metricKey: 'members.expiringThisWeek',
      message: (count) => `${count} patient recalls overdue`,
      subMessage: 'Send automated recall reminders to fill empty chairs',
    },
    chartTitle: 'Monthly Treatment Revenue',
    chartMetricLabel: 'Treatment Revenue',
    quickActions: [
      { label: 'Patients', href: '/dashboard/members', icon: Users },
      { label: 'Send Recalls', href: '/dashboard/campaigns', icon: CalendarClock, primary: true },
    ],
  },
  AGENCY: {
    statCards: [
      { key: 'active', label: 'Active Clients', valueKey: 'members.active', subKey: 'members.trial', subLabel: 'open proposals', icon: Users, href: '/dashboard/members?status=ACTIVE' },
      { key: 'renewals', label: 'Renewals This Week', valueKey: 'members.expiringThisWeek', icon: CalendarClock, trendLabel: 'win rate' },
      { key: 'revenue', label: 'Monthly Revenue', valueKey: 'revenue.thisMonth', icon: TrendingUp },
      { key: 'stalled', label: 'Stalled Follow-ups', valueKey: 'recovery.followUpsDue', icon: AlertCircle, href: '/dashboard/members' },
    ],
    urgencyAlert: {
      metricKey: 'recovery.followUpsDue',
      message: (count) => `${count} proposals stalling — no follow-up sent`,
      subMessage: 'Send proposal follow-ups before clients go silent',
    },
    chartTitle: 'Monthly Retainer Revenue',
    chartMetricLabel: 'Retainer Revenue',
    quickActions: [
      { label: 'Clients', href: '/dashboard/members', icon: Users },
      { label: 'Follow Up', href: '/dashboard/campaigns', icon: FileText, primary: true },
    ],
  },
};

// ─── Utility: resolve nested keys like "members.active" from metrics object ──

function resolveKey(obj: any, key: string): any {
  return key.split('.').reduce((acc, k) => acc?.[k], obj);
}

// ─── Stat Card Component ──────────────────────────────────────────────────────

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

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

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
    queryFn: () => {
      if (org?.businessType === 'CLINIC') {
        return patientsApi.scheduledReminders(7) as any;
      }
      if (org?.businessType === 'SALON') {
        return clientsApi.scheduledReminders(7) as any;
      }
      return membersApi.expiringSoon(7) as any;
    },
  });

  const { data: activity } = useQuery({
    queryKey: ['analytics', 'activity'],
    queryFn: () => analyticsApi.activity() as any,
  });

  const m = metrics as any;
  const recovery = m?.recovery || {};
  const pack = getVerticalPack(org?.businessType);
  const nicheType = (org?.businessType || 'GYM').toUpperCase();
  const kpis = NICHE_KPIS[nicheType] || NICHE_KPIS.GYM;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with niche-specific title and quick actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{pack.dashboardTitle}</h1>
          <p className="text-zinc-500 text-sm mt-1">{org?.name || 'Your Business'} — {pack.positioning}</p>
        </div>
        <div className="flex gap-3">
          {kpis.quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`${action.primary ? 'btn-primary' : 'btn-secondary'} text-sm flex items-center gap-2`}
            >
              <action.icon className="w-4 h-4" /> {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Niche-specific urgency alert */}
      {(resolveKey(m, kpis.urgencyAlert.metricKey) > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-amber-300 font-medium text-sm">
              {kpis.urgencyAlert.message(resolveKey(m, kpis.urgencyAlert.metricKey))}
            </p>
            <p className="text-amber-400/70 text-xs">{kpis.urgencyAlert.subMessage}</p>
          </div>
          <Link href="/dashboard/members" className="btn-secondary text-xs py-1.5 px-3 shrink-0">
            View {pack.primaryNavLabel} {'>'}
          </Link>
        </div>
      )}

      {/* Revenue at risk — universal */}
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

      {/* Niche-specific stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.statCards.map((card) => {
          const rawValue = resolveKey(m, card.valueKey);
          const isCurrency = card.key === 'revenue' || card.key === 'recovered' || card.key === 'atRisk' || card.key === 'overdue' || card.key === 'pipeline';
          const displayValue = metricsLoading ? '—' : isCurrency ? formatCurrency(rawValue || 0) : (rawValue || 0);
          const sub = card.subKey
            ? `${resolveKey(m, card.subKey) || 0} ${card.subLabel || ''}`
            : card.subLabel || undefined;

          return (
            <StatCard
              key={card.key}
              label={card.label}
              value={displayValue}
              sub={sub}
              icon={card.icon}
              trend={card.trendLabel ? {
                value: `${m?.revenue?.renewalRate || 0}% ${card.trendLabel}`,
                up: (m?.revenue?.renewalRate || 0) > 70,
              } : undefined}
              href={card.href}
            />
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart with niche-specific title */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">{kpis.chartTitle}</h3>
          {revenueChart && (
            <RechartsResponsiveContainer width="100%" height={220}>
              <RechartsAreaChart data={revenueChart} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={pack.accentColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={pack.accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <RechartsCartesianGrid strokeDasharray="3 3" stroke="#2d2d45" vertical={false} />
                <RechartsXAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <RechartsYAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${(Number(value) / 1000).toFixed(0)}k`} />
                <RechartsTooltip
                  contentStyle={{ background: '#1a1a24', border: '1px solid #2d2d45', borderRadius: '12px', color: '#f4f4f5' }}
                  formatter={(value: number) => [formatCurrency(value), kpis.chartMetricLabel]}
                />
                <Area type="monotone" dataKey="revenue" stroke={pack.accentColor} strokeWidth={2} fill="url(#revenueGrad)" />
              </RechartsAreaChart>
            </RechartsResponsiveContainer>
          )}
        </div>

        {/* Status pie chart with niche-specific label */}
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

      {/* Expiring / Action list + Activity */}
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
                const dateVal = org?.businessType === 'CLINIC'
                  ? member.nextAppointmentDate || member.lastAppointmentDate
                  : org?.businessType === 'SALON'
                  ? member.nextBookingDate || member.lastVisitDate
                  : member.renewalDate;

                const amountVal = org?.businessType === 'CLINIC'
                  ? member.treatmentValue
                  : org?.businessType === 'SALON'
                  ? member.averageSpend
                  : member.amount;

                const days = daysUntil(dateVal);
                return (
                  <Link key={member.id} href={`/dashboard/members/${member.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-100 transition-colors group">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: `${pack.accentColor}30`, borderColor: `${pack.accentColor}50` }}
                    >
                      {member.contact.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{member.contact.name}</p>
                      <p className="text-xs text-zinc-500">{pack.retentionObject} — {formatCurrency(Number(amountVal))}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${days <= 3 ? 'text-red-400' : 'text-amber-400'}`}>
                        {days === 0 ? 'Today' : `${days}d`}
                      </p>
                      <p className="text-xs text-zinc-600">{formatDate(dateVal)}</p>
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
