'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orgApi, authApi, billingApi } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import {
  Building2, Users, CreditCard, UserPlus, AlertCircle,
} from 'lucide-react';

type Tab = 'general' | 'integrations' | 'team' | 'billing';

export default function SettingsPage() {
  const qc = useQueryClient();
  const { user, org, setOrg } = useAuthStore();
  const [tab, setTab] = useState<Tab>('general');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('STAFF');

  const { data: orgData } = useQuery({ queryKey: ['org'], queryFn: () => orgApi.get() as any });
  const { data: teamData } = useQuery({ queryKey: ['org', 'members'], queryFn: () => orgApi.members() as any, enabled: tab === 'team' });
  const { data: subscription } = useQuery({ queryKey: ['billing', 'subscription'], queryFn: () => billingApi.subscription() as any, enabled: tab === 'billing' });

  const updateOrg = useMutation({
    mutationFn: (data: Record<string, unknown>) => orgApi.update(data),
    onSuccess: (data: any) => { setOrg(data); toast.success('Settings updated'); qc.invalidateQueries({ queryKey: ['org'] }); },
    onError: () => toast.error('Failed to update settings'),
  });

  const inviteUser = useMutation({
    mutationFn: () => authApi.invite(inviteEmail, inviteRole),
    onSuccess: () => { toast.success('Invite sent!'); setInviteEmail(''); qc.invalidateQueries({ queryKey: ['org', 'members'] }); },
    onError: () => toast.error('Failed to send invite'),
  });

  const orgInfo = orgData || org;
  const team: any[] = teamData || [];

  const tabs = [
    { id: 'general', label: 'Organization', icon: Building2 },
    { id: 'integrations', label: 'Integrations', icon: SettingsIcon },
    { id: 'team', label: 'Team Members', icon: Users },
    { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  ];

  const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
    OWNER: { label: 'Owner', cls: 'badge-purple' },
    ADMIN: { label: 'Admin', cls: 'badge-blue' },
    MANAGER: { label: 'Manager', cls: 'badge-yellow' },
    STAFF: { label: 'Staff', cls: 'badge-gray' },
  };

  const PLAN_LABELS: Record<string, { label: string; price: string }> = {
    STARTER: { label: 'Starter', price: '₹2,999/mo' },
    GROWTH: { label: 'Growth', price: '₹5,999/mo' },
    PRO: { label: 'Pro', price: '₹9,999/mo' },
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your organization, team, and billing</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-200 pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-[5px] ${
              tab === t.id ? 'border-brand-500 text-brand-300' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {tab === 'general' && (
        <div className="card p-6 space-y-5">
          <h3 className="text-sm font-semibold text-zinc-300">Organization Details</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Business Name</label>
              <input defaultValue={orgInfo?.name} className="input" onBlur={(e) => { if (e.target.value !== orgInfo?.name) updateOrg.mutate({ name: e.target.value }); }} />
            </div>
            <div>
              <label className="label">Business Type</label>
              <input value={orgInfo?.businessType || ''} disabled className="input opacity-60 cursor-not-allowed" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input defaultValue={orgInfo?.phone || ''} placeholder="+91 98765 43210" className="input" onBlur={(e) => updateOrg.mutate({ phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input defaultValue={orgInfo?.email || ''} placeholder="info@yourbusiness.com" className="input" onBlur={(e) => updateOrg.mutate({ email: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <input defaultValue={orgInfo?.address || ''} placeholder="123 Street, City, State" className="input" onBlur={(e) => updateOrg.mutate({ address: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {tab === 'integrations' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">WhatsApp Business API</h3>
            <p className="text-sm text-zinc-500 mb-6">Connect your own WhatsApp Business account to send automated messages directly from your number.</p>
            
            <div className="space-y-4">
              <div>
                <label className="label">Phone Number ID</label>
                <input 
                  defaultValue={orgInfo?.whatsappPhoneNumberId || ''} 
                  placeholder="e.g. 123456789012345" 
                  className="input" 
                  onBlur={(e) => updateOrg.mutate({ whatsappPhoneNumberId: e.target.value })} 
                />
              </div>
              <div>
                <label className="label">WhatsApp Business Account ID</label>
                <input 
                  defaultValue={orgInfo?.whatsappBusinessId || ''} 
                  placeholder="e.g. 123456789012345" 
                  className="input" 
                  onBlur={(e) => updateOrg.mutate({ whatsappBusinessId: e.target.value })} 
                />
              </div>
              <div>
                <label className="label">Permanent Access Token</label>
                <input 
                  type="password"
                  defaultValue={orgInfo?.whatsappAccessToken || ''} 
                  placeholder="EAAGm0..." 
                  className="input" 
                  onBlur={(e) => updateOrg.mutate({ whatsappAccessToken: e.target.value })} 
                />
              </div>
            </div>
            
            {orgInfo?.whatsappPhoneNumberId && orgInfo?.whatsappAccessToken && (
              <div className="mt-6 flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm font-medium">
                <Shield className="w-4 h-4" /> WhatsApp configured successfully
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team Tab */}
      {tab === 'team' && (
        <div className="space-y-6">
          {/* Invite */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Invite Team Member</h3>
            <div className="flex gap-3">
              <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@business.com" className="input flex-1" />
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="select w-36">
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="STAFF">Staff</option>
              </select>
              <button onClick={() => inviteUser.mutate()} disabled={!inviteEmail} className="btn-primary flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Invite
              </button>
            </div>
          </div>

          {/* Team List */}
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Last Login</th></tr>
              </thead>
              <tbody>
                {team.map((m: any) => {
                  const role = ROLE_LABELS[m.role] || ROLE_LABELS.STAFF;
                  return (
                    <tr key={m.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 text-xs font-bold">{m.name[0]}</div>
                          <span className="text-zinc-200 font-medium text-sm">{m.name}</span>
                          {m.id === user?.id && <span className="badge-purple text-[10px] px-1.5">You</span>}
                        </div>
                      </td>
                      <td className="text-zinc-400 text-sm">{m.email}</td>
                      <td><span className={role.cls}>{role.label}</span></td>
                      <td className="text-xs text-zinc-500">{m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {tab === 'billing' && (
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Current Plan</h3>
            {subscription ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-zinc-100">
                    {PLAN_LABELS[subscription.plan]?.label || subscription.plan}
                  </p>
                  <p className="text-sm text-zinc-500">{PLAN_LABELS[subscription.plan]?.price || ''}</p>
                  <div className="mt-2">
                    <span className={subscription.status === 'ACTIVE' ? 'badge-green' : subscription.status === 'TRIALING' ? 'badge-blue' : 'badge-red'}>
                      {subscription.status === 'TRIALING' ? 'Free Trial' : subscription.status}
                    </span>
                    {subscription.status === 'TRIALING' && subscription.currentPeriodEnd && (
                      <span className="text-xs text-zinc-500 ml-2">
                        Trial ends: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button className="btn-primary text-sm">Upgrade Plan</button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-amber-300 font-medium text-sm">No active subscription</p>
                  <p className="text-amber-400/70 text-xs">Choose a plan to get started</p>
                </div>
              </div>
            )}
          </div>

          {/* Plan Comparison */}
          <div className="grid grid-cols-3 gap-4">
            {(['STARTER', 'GROWTH', 'PRO'] as const).map((plan) => {
              const planInfo = PLAN_LABELS[plan];
              const isCurrent = subscription?.plan === plan;
              return (
                <div key={plan} className={`card p-5 ${isCurrent ? 'border-brand-500/50 shadow-glow' : ''}`}>
                  <h4 className="font-bold text-zinc-100">{planInfo.label}</h4>
                  <p className="text-xl font-black text-zinc-100 mt-2">{planInfo.price}</p>
                  <button disabled={isCurrent} className={`mt-4 w-full text-sm py-2 ${isCurrent ? 'btn-secondary opacity-60 cursor-not-allowed' : 'btn-primary'}`}>
                    {isCurrent ? 'Current Plan' : 'Upgrade'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
