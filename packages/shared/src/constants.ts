// ─── Business Types ───────────────────────────────────────────────────────────

export const BUSINESS_TYPES = {
  GYM: { label: 'Gym / Fitness', icon: '🏋️', color: '#f97316' },
  CLINIC: { label: 'Clinic / Healthcare', icon: '🏥', color: '#06b6d4' },
  SALON: { label: 'Salon / Beauty', icon: '💇', color: '#ec4899' },
  COACHING: { label: 'Coaching / Education', icon: '📚', color: '#8b5cf6' },
  REAL_ESTATE: { label: 'Real Estate', icon: '🏠', color: '#10b981' },
  DENTAL: { label: 'Dental', icon: '🦷', color: '#3b82f6' },
  AGENCY: { label: 'Agency / Services', icon: '📊', color: '#f59e0b' },
  OTHER: { label: 'Other Business', icon: '🏢', color: '#6b7280' },
} as const;

export type BusinessType = keyof typeof BUSINESS_TYPES;

// ─── Plans ────────────────────────────────────────────────────────────────────

export const PLANS = {
  STARTER: {
    label: 'Starter',
    price: 2999,
    currency: 'INR',
    description: 'Perfect for small gyms getting started',
    features: ['Up to 200 members', 'WhatsApp reminders', 'Basic CRM', 'Email support'],
    limits: { members: 200, users: 2, campaigns: 5, aiCredits: 100 },
  },
  GROWTH: {
    label: 'Growth',
    price: 5999,
    currency: 'INR',
    description: 'For growing businesses that need automation',
    features: ['Up to 1000 members', 'Full automation', 'AI assistant', 'Campaign engine', 'Analytics', 'Priority support'],
    limits: { members: 1000, users: 5, campaigns: 20, aiCredits: 500 },
  },
  PRO: {
    label: 'Pro',
    price: 9999,
    currency: 'INR',
    description: 'For established businesses with high volume',
    features: ['Unlimited members', 'Advanced AI', 'Custom workflows', 'API access', 'Dedicated support', 'Custom reports'],
    limits: { members: -1, users: 20, campaigns: -1, aiCredits: 2000 },
  },
  ENTERPRISE: {
    label: 'Enterprise',
    price: 0,
    currency: 'INR',
    description: 'Custom pricing for large organizations',
    features: ['Custom everything', 'White-label option', 'SLA guarantee', 'Dedicated account manager'],
    limits: { members: -1, users: -1, campaigns: -1, aiCredits: -1 },
  },
} as const;

export type Plan = keyof typeof PLANS;

// ─── Member Status ────────────────────────────────────────────────────────────

export const MEMBER_STATUS_LABELS = {
  ACTIVE: { label: 'Active', color: 'green' },
  TRIAL: { label: 'Trial', color: 'blue' },
  EXPIRED: { label: 'Expired', color: 'red' },
  FROZEN: { label: 'Frozen', color: 'yellow' },
  CANCELLED: { label: 'Cancelled', color: 'gray' },
} as const;

// ─── Lead Status ──────────────────────────────────────────────────────────────

export const LEAD_STATUS_LABELS = {
  NEW: { label: 'New Lead', color: 'blue', order: 0 },
  CONTACTED: { label: 'Contacted', color: 'yellow', order: 1 },
  INTERESTED: { label: 'Interested', color: 'orange', order: 2 },
  TRIAL: { label: 'On Trial', color: 'purple', order: 3 },
  CONVERTED: { label: 'Converted', color: 'green', order: 4 },
  NURTURING: { label: 'Nurturing', color: 'cyan', order: 5 },
  LOST: { label: 'Lost', color: 'red', order: 6 },
} as const;

// ─── Channels ────────────────────────────────────────────────────────────────

export const CHANNELS = {
  WHATSAPP: { label: 'WhatsApp', icon: '💬', color: '#25d366' },
  EMAIL: { label: 'Email', icon: '📧', color: '#6366f1' },
  SMS: { label: 'SMS', icon: '📱', color: '#f59e0b' },
  IN_APP: { label: 'In-App', icon: '🔔', color: '#8b5cf6' },
} as const;

// ─── Indian States ────────────────────────────────────────────────────────────

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
];
