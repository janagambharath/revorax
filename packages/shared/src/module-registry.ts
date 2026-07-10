import type { BusinessType } from './vertical-packs';

// ─── Dashboard Module Definition ──────────────────────────────────────────────

export type DashboardModule = {
  key: string;
  label: string;
  href: string;
  icon: string; // lucide icon name
  section: 'revenue' | 'crm' | 'engage' | 'intelligence';
};

export type DashboardSection = {
  key: string;
  label: string;
  modules: DashboardModule[];
};

// ─── Module Definitions (all possible modules) ───────────────────────────────

const ALL_MODULES: Record<string, Omit<DashboardModule, 'label'>> = {
  dashboard: { key: 'dashboard', href: '/dashboard', icon: 'LayoutDashboard', section: 'revenue' },
  members: { key: 'members', href: '/dashboard/members', icon: 'Users', section: 'revenue' },
  contacts: { key: 'contacts', href: '/dashboard/contacts', icon: 'Contact', section: 'crm' },
  leads: { key: 'leads', href: '/dashboard/leads', icon: 'Target', section: 'crm' },
  tasks: { key: 'tasks', href: '/dashboard/tasks', icon: 'CheckSquare', section: 'crm' },
  messages: { key: 'messages', href: '/dashboard/messages', icon: 'MessageSquare', section: 'engage' },
  campaigns: { key: 'campaigns', href: '/dashboard/campaigns', icon: 'Megaphone', section: 'engage' },
  templates: { key: 'templates', href: '/dashboard/templates', icon: 'FileText', section: 'engage' },
  workflows: { key: 'workflows', href: '/dashboard/workflows', icon: 'Workflow', section: 'engage' },
  analytics: { key: 'analytics', href: '/dashboard/analytics', icon: 'BarChart3', section: 'intelligence' },
  ai: { key: 'ai', href: '/dashboard/ai-assistant', icon: 'Sparkles', section: 'intelligence' },
};

// ─── Niche-Specific Labels ────────────────────────────────────────────────────

const MODULE_LABELS: Record<BusinessType, Record<string, string>> = {
  GYM: {
    dashboard: 'Dashboard',
    members: 'Members',
    contacts: 'Contacts',
    leads: 'Leads',
    tasks: 'Tasks',
    messages: 'Messages',
    campaigns: 'Campaigns',
    templates: 'Templates',
    workflows: 'Automations',
    analytics: 'Analytics',
    ai: 'AI Assistant',
  },
  CLINIC: {
    dashboard: 'Dashboard',
    members: 'Patients',
    contacts: 'Contacts',
    leads: 'Inquiries',
    tasks: 'Tasks',
    messages: 'Messages',
    campaigns: 'Campaigns',
    templates: 'Templates',
    workflows: 'Automations',
    analytics: 'Analytics',
    ai: 'AI Assistant',
  },
  SALON: {
    dashboard: 'Dashboard',
    members: 'Clients',
    contacts: 'Contacts',
    leads: 'Walk-ins',
    tasks: 'Tasks',
    messages: 'Messages',
    campaigns: 'Campaigns',
    templates: 'Templates',
    workflows: 'Automations',
    analytics: 'Analytics',
    ai: 'AI Assistant',
  },
  COACHING: {
    dashboard: 'Dashboard',
    members: 'Students',
    contacts: 'Contacts',
    leads: 'Admissions',
    tasks: 'Tasks',
    messages: 'Messages',
    campaigns: 'Campaigns',
    templates: 'Templates',
    workflows: 'Automations',
    analytics: 'Analytics',
    ai: 'AI Assistant',
  },
  REAL_ESTATE: {
    dashboard: 'Dashboard',
    members: 'Prospects',
    contacts: 'Contacts',
    leads: 'Leads',
    tasks: 'Tasks',
    messages: 'Messages',
    campaigns: 'Campaigns',
    templates: 'Templates',
    workflows: 'Automations',
    analytics: 'Analytics',
    ai: 'AI Assistant',
  },
  DENTAL: {
    dashboard: 'Dashboard',
    members: 'Patients',
    contacts: 'Contacts',
    leads: 'Inquiries',
    tasks: 'Tasks',
    messages: 'Messages',
    campaigns: 'Campaigns',
    templates: 'Templates',
    workflows: 'Automations',
    analytics: 'Analytics',
    ai: 'AI Assistant',
  },
  AGENCY: {
    dashboard: 'Dashboard',
    members: 'Clients',
    contacts: 'Contacts',
    leads: 'Proposals',
    tasks: 'Tasks',
    messages: 'Messages',
    campaigns: 'Campaigns',
    templates: 'Templates',
    workflows: 'Automations',
    analytics: 'Analytics',
    ai: 'AI Assistant',
  },
  OTHER: {
    dashboard: 'Dashboard',
    members: 'Customers',
    contacts: 'Contacts',
    leads: 'Leads',
    tasks: 'Tasks',
    messages: 'Messages',
    campaigns: 'Campaigns',
    templates: 'Templates',
    workflows: 'Automations',
    analytics: 'Analytics',
    ai: 'AI Assistant',
  },
};

// ─── Section Labels ───────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  revenue: 'Revenue',
  crm: 'CRM',
  engage: 'Engage',
  intelligence: 'Intelligence',
};

// ─── Module Visibility per Business Type ──────────────────────────────────────
// Controls which modules appear in the dashboard for each business type.
// 'dashboard' is always visible and is not listed here.

const VISIBLE_MODULES: Record<BusinessType, string[]> = {
  GYM: ['members', 'contacts', 'leads', 'tasks', 'messages', 'campaigns', 'templates', 'workflows', 'analytics', 'ai'],
  CLINIC: ['members', 'contacts', 'leads', 'tasks', 'messages', 'campaigns', 'templates', 'workflows', 'analytics', 'ai'],
  SALON: ['members', 'contacts', 'tasks', 'messages', 'campaigns', 'templates', 'workflows', 'analytics', 'ai'],
  COACHING: ['members', 'contacts', 'leads', 'tasks', 'messages', 'campaigns', 'templates', 'workflows', 'analytics', 'ai'],
  REAL_ESTATE: ['members', 'contacts', 'leads', 'tasks', 'messages', 'campaigns', 'templates', 'workflows', 'analytics', 'ai'],
  DENTAL: ['members', 'contacts', 'leads', 'tasks', 'messages', 'campaigns', 'templates', 'workflows', 'analytics', 'ai'],
  AGENCY: ['members', 'contacts', 'leads', 'tasks', 'messages', 'campaigns', 'templates', 'workflows', 'analytics', 'ai'],
  OTHER: ['members', 'contacts', 'leads', 'tasks', 'messages', 'campaigns', 'templates', 'workflows', 'analytics', 'ai'],
};

// ─── Public API ───────────────────────────────────────────────────────────────

export function getDashboardModules(businessType?: string | null): DashboardModule[] {
  const bt = (businessType || 'OTHER').toUpperCase() as BusinessType;
  const labels = MODULE_LABELS[bt] || MODULE_LABELS.OTHER;
  const visible = VISIBLE_MODULES[bt] || VISIBLE_MODULES.OTHER;

  // Dashboard is always first
  const modules: DashboardModule[] = [
    { ...ALL_MODULES.dashboard, label: labels.dashboard || 'Dashboard' },
  ];

  for (const key of visible) {
    const mod = ALL_MODULES[key];
    if (mod) {
      modules.push({ ...mod, label: labels[key] || key });
    }
  }

  return modules;
}

export function getDashboardSections(businessType?: string | null): DashboardSection[] {
  const modules = getDashboardModules(businessType);
  const sectionMap = new Map<string, DashboardModule[]>();

  for (const mod of modules) {
    const existing = sectionMap.get(mod.section) || [];
    existing.push(mod);
    sectionMap.set(mod.section, existing);
  }

  const sections: DashboardSection[] = [];
  for (const [key, mods] of sectionMap) {
    sections.push({
      key,
      label: SECTION_LABELS[key] || key,
      modules: mods,
    });
  }

  return sections;
}

// ─── Route-to-BusinessType Mapping ────────────────────────────────────────────

export const NICHE_ROUTES: Record<string, BusinessType> = {
  gym: 'GYM',
  clinic: 'CLINIC',
  salon: 'SALON',
  coaching: 'COACHING',
  'real-estate': 'REAL_ESTATE',
  dental: 'DENTAL',
  agency: 'AGENCY',
};

export function getBusinessTypeFromRoute(route: string): BusinessType | null {
  return NICHE_ROUTES[route.toLowerCase()] || null;
}

export function getRouteFromBusinessType(businessType: string): string | null {
  const entry = Object.entries(NICHE_ROUTES).find(([, bt]) => bt === businessType);
  return entry ? entry[0] : null;
}
