'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Settings, LogOut,
  Bell, ChevronDown, MessageSquare, Contact,
  Target, CheckSquare, Megaphone, FileText,
  Workflow, BarChart3, Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { getVerticalPack, getDashboardSections } from '@revorax/shared';
import type { DashboardModule } from '@revorax/shared';

import { OnboardingWizard } from '@/components/OnboardingWizard';

// Icon mapping from string names to Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Contact,
  Target,
  CheckSquare,
  MessageSquare,
  Megaphone,
  FileText,
  Workflow,
  BarChart3,
  Sparkles,
};

function getIcon(iconName: string): React.ElementType {
  return ICON_MAP[iconName] || LayoutDashboard;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, org, fetchMe, logout } = useAuthStore();
  const pack = getVerticalPack(org?.businessType);
  const sections = getDashboardSections(org?.businessType);

  useEffect(() => {
    if (!user) {
      fetchMe().then(() => {
        const { user: u } = useAuthStore.getState();
        if (!u) router.push('/login');
      });
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
  };

  function isActive(mod: DashboardModule) {
    if (mod.href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(mod.href);
  }

  // Section labels
  const sectionLabels: Record<string, string> = {
    revenue: 'Revenue',
    crm: 'CRM',
    engage: 'Engage',
    intelligence: 'Intelligence',
  };

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <OnboardingWizard />
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-surface-50 border-r border-surface-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-surface-200">
          <span className="text-lg font-black text-gradient">⚡ Revorax</span>
        </div>

        {/* Org Info */}
        <div className="px-4 py-3 border-b border-surface-200">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-100 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white text-xs font-bold">
              {org?.name?.[0] || 'R'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-zinc-100 truncate">{org?.name}</div>
              <div className="text-xs text-zinc-500">{pack.shortLabel} Revenue Pack</div>
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          </div>
        </div>

        {/* Navigation — sectioned */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto scrollbar-hide space-y-4">
          {sections.map((section) => (
            <div key={section.key}>
              <div className="px-3 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                  {sectionLabels[section.key] || section.label}
                </span>
              </div>
              <div className="space-y-0.5">
                {section.modules.map((mod) => {
                  const Icon = getIcon(mod.icon);
                  const active = isActive(mod);
                  return (
                    <Link
                      key={mod.key}
                      href={mod.href}
                      className={active ? 'sidebar-item-active' : 'sidebar-item'}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {mod.label}
                      {mod.key === 'ai' && (
                        <span className="ml-auto badge-purple text-[10px] px-1.5 py-0.5">AI</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-surface-200 p-3 space-y-1">
          <Link href="/dashboard/settings" className={pathname.startsWith('/dashboard/settings') ? 'sidebar-item-active' : 'sidebar-item'}>
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <button onClick={handleLogout} className="sidebar-item w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-surface-50 border-b border-surface-200 flex items-center justify-between px-6">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              {(() => {
                for (const section of sections) {
                  const found = section.modules.find((m) => isActive(m));
                  if (found) return found.label;
                }
                return 'Dashboard';
              })()}
            </h2>
            <p className="text-xs text-zinc-500">
              {pack.dashboardTitle}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-xl hover:bg-surface-100 transition-colors text-zinc-400 hover:text-zinc-100">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="text-sm">
                <div className="font-medium text-zinc-100">{user?.name}</div>
                <div className="text-xs text-zinc-500 capitalize">{user?.role?.toLowerCase()}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
