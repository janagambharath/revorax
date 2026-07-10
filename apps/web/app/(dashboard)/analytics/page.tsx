'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { formatCurrency } from '@revorax/shared';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList,
} from 'recharts';
import { TrendingUp, Users, Target, Megaphone } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#10b981', TRIAL: '#3b82f6', EXPIRED: '#ef4444', FROZEN: '#f59e0b', CANCELLED: '#6b7280',
};

const FUNNEL_COLORS = ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#10b981', '#ef4444'];

export default function AnalyticsPage() {
  const { data: metrics } = useQuery({ queryKey: ['analytics', 'dashboard'], queryFn: () => analyticsApi.dashboard() as any });
  const { data: revenueChart } = useQuery({ queryKey: ['analytics', 'revenue-chart'], queryFn: () => analyticsApi.revenueChart(6) as any });
  const { data: memberStatus } = useQuery({ queryKey: ['analytics', 'member-status'], queryFn: () => analyticsApi.memberStatus() as any });
  const { data: leadFunnel } = useQuery({ queryKey: ['analytics', 'lead-funnel'], queryFn: () => analyticsApi.leadFunnel() as any });
  const { data: campaigns } = useQuery({ queryKey: ['analytics', 'campaigns'], queryFn: () => analyticsApi.campaigns() as any });

  const m = metrics as any;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Analytics</h1>
        <p className="text-zinc-500 text-sm mt-1">Revenue, retention, and campaign performance</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: m?.members?.total || 0, icon: Users, color: 'text-brand-400' },
          { label: 'Monthly Revenue', value: formatCurrency(m?.revenue?.thisMonth || 0), icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Renewal Rate', value: `${m?.revenue?.renewalRate || 0}%`, icon: Target, color: 'text-blue-400' },
          { label: 'Total Revenue', value: formatCurrency(m?.revenue?.total || 0), icon: Megaphone, color: 'text-amber-400' },
        ].map((kpi) => (
          <div key={kpi.label} className="stat-card">
            <p className="stat-label">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color} mt-1`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">Revenue Trend (6 Months)</h3>
        {revenueChart && (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueChart}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d45" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2d2d45', borderRadius: '12px', color: '#f4f4f5' }} formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Member Status + Lead Funnel */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Member Status Distribution</h3>
          {memberStatus && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={memberStatus} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d45" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="status" type="category" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.charAt(0) + v.slice(1).toLowerCase()} />
                <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2d2d45', borderRadius: '12px', color: '#f4f4f5' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {memberStatus.map((entry: any, i: number) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Lead Funnel</h3>
          {leadFunnel && (
            <div className="space-y-2">
              {leadFunnel.map((stage: any, i: number) => (
                <div key={stage.stage} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-zinc-500 text-right">{stage.stage.charAt(0) + stage.stage.slice(1).toLowerCase()}</div>
                  <div className="flex-1 bg-surface-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium transition-all"
                      style={{
                        width: `${Math.max(5, (stage.count / Math.max(...leadFunnel.map((s: any) => s.count), 1)) * 100)}%`,
                        background: FUNNEL_COLORS[i] || '#8b5cf6',
                      }}
                    >
                      {stage.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Performance */}
      {campaigns && campaigns.length > 0 && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Recent Campaign Performance</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Channel</th>
                <th>Sent</th>
                <th>Delivered</th>
                <th>Delivery Rate</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c: any) => (
                <tr key={c.id}>
                  <td className="font-medium text-zinc-200">{c.name}</td>
                  <td><span className={c.channel === 'WHATSAPP' ? 'badge-green' : 'badge-blue'}>{c.channel}</span></td>
                  <td>{c.sentCount}</td>
                  <td>{c.deliveredCount}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-surface-200 rounded-full h-1.5 max-w-24">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${c.sentCount > 0 ? Math.round((c.deliveredCount / c.sentCount) * 100) : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-400">
                        {c.sentCount > 0 ? Math.round((c.deliveredCount / c.sentCount) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
