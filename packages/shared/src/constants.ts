export { BUSINESS_TYPES, type BusinessType } from './vertical-packs';

export const PLANS = {
  STARTER: {
    label: 'Starter',
    price: 2999,
    currency: 'INR',
    description: 'Perfect for small businesses getting started',
    features: ['Up to 200 records', 'WhatsApp reminders', 'Basic CRM', 'Email support'],
    limits: { records: 200, users: 2, campaigns: 5, aiCredits: 100 },
  },
  GROWTH: {
    label: 'Growth',
    price: 5999,
    currency: 'INR',
    description: 'For growing businesses that need automation',
    features: ['Up to 1000 records', 'Full automation', 'AI assistant', 'Campaign engine', 'Analytics', 'Priority support'],
    limits: { records: 1000, users: 5, campaigns: 20, aiCredits: 500 },
  },
  PRO: {
    label: 'Pro',
    price: 9999,
    currency: 'INR',
    description: 'For established businesses with high volume',
    features: ['Unlimited records', 'Advanced AI', 'Custom workflows', 'API access', 'Dedicated support', 'Custom reports'],
    limits: { records: -1, users: 20, campaigns: -1, aiCredits: 2000 },
  },
  ENTERPRISE: {
    label: 'Enterprise',
    price: 0,
    currency: 'INR',
    description: 'Custom pricing for large organizations',
    features: ['Custom everything', 'White-label option', 'SLA guarantee', 'Dedicated account manager'],
    limits: { records: -1, users: -1, campaigns: -1, aiCredits: -1 },
  },
} as const;

export type Plan = keyof typeof PLANS;

export const MEMBER_STATUS_LABELS = {
  ACTIVE: { label: 'Active', color: 'green' },
  TRIAL: { label: 'Trial', color: 'blue' },
  EXPIRED: { label: 'Expired', color: 'red' },
  FROZEN: { label: 'Frozen', color: 'yellow' },
  CANCELLED: { label: 'Cancelled', color: 'gray' },
} as const;

export const LEAD_STATUS_LABELS = {
  NEW: { label: 'New Lead', color: 'blue', order: 0 },
  CONTACTED: { label: 'Contacted', color: 'yellow', order: 1 },
  INTERESTED: { label: 'Interested', color: 'orange', order: 2 },
  TRIAL: { label: 'Trial / Visit', color: 'purple', order: 3 },
  CONVERTED: { label: 'Converted', color: 'green', order: 4 },
  NURTURING: { label: 'Nurturing', color: 'cyan', order: 5 },
  LOST: { label: 'Lost', color: 'red', order: 6 },
} as const;

export const CHANNELS = {
  WHATSAPP: { label: 'WhatsApp', icon: 'WA', color: '#25d366' },
  EMAIL: { label: 'Email', icon: 'EM', color: '#6366f1' },
  SMS: { label: 'SMS', icon: 'SM', color: '#f59e0b' },
  IN_APP: { label: 'In-App', icon: 'IN', color: '#8b5cf6' },
} as const;

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];
