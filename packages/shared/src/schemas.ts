import { z } from 'zod';

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  orgName: z.string().min(2, 'Business name must be at least 2 characters'),
  businessType: z.enum(['GYM', 'CLINIC', 'SALON', 'COACHING', 'REAL_ESTATE', 'DENTAL', 'AGENCY', 'OTHER']),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']),
});

// ─── Contact Schemas ──────────────────────────────────────────────────────────

export const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  tags: z.array(z.string()).optional().default([]),
  source: z
    .enum(['WALK_IN', 'REFERRAL', 'WEBSITE', 'SOCIAL_MEDIA', 'COLD_CALL', 'CAMPAIGN', 'PARTNER', 'OTHER'])
    .optional()
    .default('OTHER'),
  city: z.string().optional(),
  notes: z.string().optional(),
});

export const updateContactSchema = createContactSchema.partial();

// ─── Lead Schemas ─────────────────────────────────────────────────────────────

export const createLeadSchema = z.object({
  contactId: z.string().cuid(),
  status: z
    .enum(['NEW', 'CONTACTED', 'INTERESTED', 'TRIAL', 'CONVERTED', 'LOST', 'NURTURING'])
    .optional()
    .default('NEW'),
  source: z
    .enum(['WALK_IN', 'REFERRAL', 'WEBSITE', 'SOCIAL_MEDIA', 'COLD_CALL', 'CAMPAIGN', 'PARTNER', 'OTHER'])
    .optional()
    .default('OTHER'),
  notes: z.string().optional(),
  assignedToId: z.string().cuid().optional(),
  nextFollowUpAt: z.string().datetime().optional(),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  lostReason: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
});

// ─── Member Schemas ───────────────────────────────────────────────────────────

export const createMemberSchema = z.object({
  contactId: z.string().cuid(),
  membershipType: z
    .enum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'DAY_PASS', 'CUSTOM'])
    .default('MONTHLY'),
  startDate: z.string().datetime(),
  renewalDate: z.string().datetime(),
  amount: z.number().positive('Amount must be positive'),
  notes: z.string().optional(),
  goals: z.string().optional(),
});

export const updateMemberSchema = z.object({
  membershipType: z.enum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'DAY_PASS', 'CUSTOM']).optional(),
  status: z.enum(['ACTIVE', 'TRIAL', 'EXPIRED', 'FROZEN', 'CANCELLED']).optional(),
  renewalDate: z.string().datetime().optional(),
  amount: z.number().positive().optional(),
  notes: z.string().optional(),
  goals: z.string().optional(),
  followUpStatus: z.enum(['PENDING', 'DONE', 'SCHEDULED']).optional(),
});

export const recordPaymentSchema = z.object({
  memberId: z.string().cuid(),
  amount: z.number().positive(),
  method: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'RAZORPAY', 'OTHER']).default('CASH'),
  paidAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// ─── Task Schemas ─────────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  contactId: z.string().cuid().optional(),
  assignedToId: z.string().cuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueAt: z.string().datetime().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

// ─── Message Schemas ──────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  contactId: z.string().cuid(),
  channel: z.enum(['WHATSAPP', 'EMAIL', 'SMS']),
  body: z.string().min(1),
  templateId: z.string().cuid().optional(),
  templateVariables: z.record(z.string()).optional(),
});

// ─── Campaign Schemas ─────────────────────────────────────────────────────────

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  channel: z.enum(['WHATSAPP', 'EMAIL']),
  templateId: z.string().cuid().optional(),
  customBody: z.string().optional(),
  audienceFilter: z
    .object({
      memberStatus: z.array(z.string()).optional(),
      membershipType: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      renewalDateRange: z
        .object({ from: z.string().datetime(), to: z.string().datetime() })
        .optional(),
    })
    .optional()
    .default({}),
  scheduledAt: z.string().datetime().optional(),
});

// ─── Template Schemas ─────────────────────────────────────────────────────────

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  channel: z.enum(['WHATSAPP', 'EMAIL', 'SMS']),
  category: z
    .enum(['MARKETING', 'UTILITY', 'AUTHENTICATION', 'REMINDER', 'FOLLOW_UP', 'RENEWAL', 'WELCOME', 'CUSTOM'])
    .default('CUSTOM'),
  subject: z.string().optional(),
  body: z.string().min(1, 'Template body is required'),
});

// ─── AI Schemas ───────────────────────────────────────────────────────────────

export const aiFollowUpSchema = z.object({
  contactId: z.string().cuid(),
  channel: z.enum(['WHATSAPP', 'EMAIL']).default('WHATSAPP'),
  context: z.string().optional(),
});

export const aiClassifyLeadSchema = z.object({
  leadId: z.string().cuid(),
});

export const aiNextActionSchema = z.object({
  contactId: z.string().cuid(),
});

export const aiGenerateCopySchema = z.object({
  purpose: z.string().min(1),
  channel: z.enum(['WHATSAPP', 'EMAIL']).default('WHATSAPP'),
  audience: z.string().optional(),
  tone: z.enum(['professional', 'friendly', 'urgent']).default('friendly'),
});

// ─── Pagination ───────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
