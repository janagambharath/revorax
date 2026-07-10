import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — redirect to login on 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (!pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  },
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (data: { name: string; email: string; password: string; orgName: string; businessType: string }) =>
    api.post('/auth/signup', data),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  invite: (email: string, role: string) => api.post('/auth/invite', { email, role }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  revenueChart: (months?: number) => api.get(`/analytics/revenue-chart${months ? `?months=${months}` : ''}`),
  memberStatus: () => api.get('/analytics/member-status'),
  leadFunnel: () => api.get('/analytics/lead-funnel'),
  campaigns: () => api.get('/analytics/campaigns'),
  activity: () => api.get('/analytics/activity'),
};

// ─── Members ──────────────────────────────────────────────────────────────────
export const membersApi = {
  list: (params?: Record<string, unknown>) => api.get('/members', { params }),
  get: (id: string) => api.get(`/members/${id}`),
  create: (data: Record<string, unknown>) => api.post('/members', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/members/${id}`, data),
  delete: (id: string) => api.delete(`/members/${id}`),
  importCsv: (members: any[]) => api.post('/members/import', { members }),
  expiringSoon: (days?: number) => api.get(`/members/expiring-soon${days ? `?days=${days}` : ''}`),
  overdue: () => api.get('/members/overdue'),
  reactivation: () => api.get('/members/reactivation'),
  recordPayment: (data: Record<string, unknown>) => api.post('/members/payments', data),
  markFollowUp: (id: string, status = 'DONE') => api.post(`/members/${id}/follow-up`, { status }),
};



// ─── Contacts ─────────────────────────────────────────────────────────────────
export const contactsApi = {
  list: (params?: Record<string, unknown>) => api.get('/contacts', { params }),
  get: (id: string) => api.get(`/contacts/${id}`),
  create: (data: Record<string, unknown>) => api.post('/contacts', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/contacts/${id}`),
};

// ─── Leads ────────────────────────────────────────────────────────────────────
export const leadsApi = {
  list: (params?: Record<string, unknown>) => api.get('/leads', { params }),
  create: (data: Record<string, unknown>) => api.post('/leads', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/leads/${id}`, data),
  delete: (id: string) => api.delete(`/leads/${id}`),
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksApi = {
  list: (params?: Record<string, unknown>) => api.get('/tasks', { params }),
  create: (data: Record<string, unknown>) => api.post('/tasks', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messagesApi = {
  byContact: (contactId: string) => api.get(`/messages/contact/${contactId}`),
  sendWhatsApp: (data: Record<string, unknown>) => api.post('/messages/send/whatsapp', data),
  sendEmail: (data: Record<string, unknown>) => api.post('/messages/send/email', data),
};

// ─── Templates ────────────────────────────────────────────────────────────────
export const templatesApi = {
  list: (params?: Record<string, unknown>) => api.get('/templates', { params }),
  get: (id: string) => api.get(`/templates/${id}`),
  create: (data: Record<string, unknown>) => api.post('/templates', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/templates/${id}`, data),
  delete: (id: string) => api.delete(`/templates/${id}`),
};

// ─── Campaigns ────────────────────────────────────────────────────────────────
export const campaignsApi = {
  list: (params?: Record<string, unknown>) => api.get('/campaigns', { params }),
  create: (data: Record<string, unknown>) => api.post('/campaigns', data),
  previewAudience: (data: Record<string, unknown>) => api.post('/campaigns/preview-audience', data),
  execute: (id: string) => api.post(`/campaigns/${id}/execute`),
  delete: (id: string) => api.delete(`/campaigns/${id}`),
};

// ─── AI ───────────────────────────────────────────────────────────────────────
export const aiApi = {
  followUp: (data: { contactId: string; channel?: string; context?: string }) =>
    api.post('/ai/follow-up', data),
  classifyLead: (leadId: string) => api.post(`/ai/classify-lead/${leadId}`),
  nextAction: (contactId: string) => api.post(`/ai/next-action/${contactId}`),
  generateCopy: (data: Record<string, unknown>) => api.post('/ai/generate-copy', data),
  summarize: (contactId: string) => api.post(`/ai/summarize/${contactId}`),
};

// ─── Organization ─────────────────────────────────────────────────────────────
export const orgApi = {
  get: () => api.get('/organizations/me'),
  update: (data: Record<string, unknown>) => api.put('/organizations/me', data),
  members: () => api.get('/organizations/me/members'),
};

// ─── Notes ────────────────────────────────────────────────────────────────────
export const notesApi = {
  byContact: (contactId: string) => api.get(`/notes/contact/${contactId}`),
  create: (data: Record<string, unknown>) => api.post('/notes', data),
  delete: (id: string) => api.delete(`/notes/${id}`),
};

// ─── Billing ──────────────────────────────────────────────────────────────────
export const billingApi = {
  subscription: () => api.get('/billing/subscription'),
  checkout: (plan: string) => api.post('/billing/checkout', { plan }),
};
