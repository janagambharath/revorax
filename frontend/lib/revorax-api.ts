export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type User = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string;
};

export type Business = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  business_phone: string | null;
  website: string | null;
  business_hours: BusinessHours | null;
  services_offered: string[] | null;
  service_area_zip_codes: string[] | null;
  faqs: BusinessFaq[] | null;
  greeting_message: string | null;
  timezone: string;
  call_transfer_number: string | null;
  auto_booking_enabled: boolean;
  appointment_slot_minutes: number;
  minimum_notice_minutes: number;
  review_request_enabled: boolean;
  review_request_delay_hours: number;
  crm_webhook_url: string | null;
  twilio_phone_number: string | null;
  plan: string;
  status: string;
  created_at: string;
};

export type BusinessHourEntry = {
  open?: string;
  close?: string;
  closed?: boolean;
};

export type BusinessHours = Record<string, BusinessHourEntry>;

export type BusinessFaq = {
  question: string;
  answer: string;
};

export type LeadStatus = "new" | "contacted" | "booked" | "lost";
export type LeadUrgency = "emergency" | "soon" | "flexible" | "unknown";

export type Lead = {
  id: string;
  source: string;
  caller_name: string | null;
  caller_phone: string;
  caller_email: string | null;
  caller_address: string | null;
  zip_code: string | null;
  service_type: string | null;
  urgency: LeadUrgency;
  preferred_time: string | null;
  notes: string | null;
  transcript: string | null;
  ai_summary: string | null;
  estimated_value: number | null;
  actual_revenue: number | null;
  consent_status: string;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  crm_synced_at: string | null;
  status: LeadStatus;
  created_at: string;
};

export type CallLog = {
  id: string;
  lead_id: string | null;
  twilio_call_sid: string;
  direction: "inbound" | "outbound" | string;
  from_number: string;
  to_number: string;
  duration_seconds: number | null;
  recording_url: string | null;
  transcription: string | null;
  status: "answered" | "missed" | "voicemail" | string;
  created_at: string;
};

export type SMSMessage = {
  id: string;
  lead_id: string | null;
  direction: "inbound" | "outbound" | string;
  from_number: string;
  to_number: string;
  body: string;
  created_at: string;
};

export type AppointmentStatus = "confirmed" | "reminded" | "completed" | "no_show" | "cancelled";

export type Appointment = {
  id: string;
  lead_id: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  service_type: string | null;
  notes: string | null;
  booking_source: string;
  actual_revenue: number | null;
  customer_confirmed_at: string | null;
  status: AppointmentStatus;
  created_at: string;
};

export type DashboardStats = {
  leads_today: number;
  leads_this_week: number;
  leads_this_month: number;
  calls_today: number;
  missed_calls_today: number;
  appointments_upcoming: number;
  leads_by_status: Record<string, number>;
  booked_leads_this_month?: number;
  completed_jobs_this_month?: number;
  revenue_this_month?: number;
  conversion_rate?: number;
  pending_callbacks?: number;
};

export type RevenueAnalytics = {
  period_start: string;
  leads: number;
  booked_leads: number;
  completed_jobs: number;
  estimated_pipeline_value: number;
  realized_revenue: number;
  conversion_rate: number;
};

export type BusinessInput = {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  business_phone?: string;
  website?: string;
  business_hours?: BusinessHours;
  services_offered?: string[];
  service_area_zip_codes?: string[];
  faqs?: BusinessFaq[];
  greeting_message?: string;
  call_transfer_number?: string | null;
  auto_booking_enabled?: boolean;
  appointment_slot_minutes?: number;
  minimum_notice_minutes?: number;
  review_request_enabled?: boolean;
  review_request_delay_hours?: number;
  crm_webhook_url?: string | null;
  timezone?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const TOKEN_STORAGE_KEY = "revorax.auth.tokens";

export function getStoredTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as AuthTokens;
    return parsed.access_token && parsed.refresh_token ? parsed : null;
  } catch {
    return null;
  }
}

export function storeTokens(tokens: AuthTokens) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

export function clearStoredTokens() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "object" && payload !== null && "detail" in payload) {
    const detail = payload.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

export async function apiFetch<T>(path: string, accessToken?: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`/api/v1${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      // FastAPI responses normally contain JSON, but a proxy failure might not.
    }
    throw new ApiError(response.status, getErrorMessage(payload, `Request failed (${response.status})`));
  }

  return response.json() as Promise<T>;
}

export function login(email: string, password: string) {
  return apiFetch<AuthTokens>("/auth/login", undefined, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signup(fullName: string, email: string, password: string, phone?: string, inviteCode?: string) {
  return apiFetch<AuthTokens>("/auth/signup", undefined, {
    method: "POST",
    body: JSON.stringify({
      full_name: fullName,
      email,
      password,
      phone: phone || null,
      invite_code: inviteCode || null,
    }),
  });
}

export function getCurrentUser(accessToken: string) {
  return apiFetch<User>("/auth/me", accessToken);
}

export function getBusiness(accessToken: string) {
  return apiFetch<Business>("/business/", accessToken);
}

export function createBusiness(accessToken: string, input: BusinessInput) {
  return apiFetch<Business>("/business/", accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateBusiness(accessToken: string, input: Partial<BusinessInput>) {
  return apiFetch<Business>("/business/", accessToken, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function getLeads(accessToken: string, status?: LeadStatus) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<Lead[]>(`/dashboard/leads${query}`, accessToken);
}

export function getLead(accessToken: string, leadId: string) {
  return apiFetch<Lead>(`/dashboard/leads/${leadId}`, accessToken);
}

export function updateLeadStatus(accessToken: string, leadId: string, status: LeadStatus) {
  return apiFetch<Lead>(`/dashboard/leads/${leadId}/status`, accessToken, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function scheduleLeadCallback(
  accessToken: string,
  leadId: string,
  input: { scheduled_for?: string; notes?: string },
) {
  return apiFetch<Lead>(`/dashboard/leads/${leadId}/callback`, accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function sendLeadSms(accessToken: string, leadId: string, body: string) {
  return apiFetch<{ status: string; job_id: string; created: boolean }>(`/dashboard/leads/${leadId}/sms`, accessToken, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function getCalls(accessToken: string) {
  return apiFetch<CallLog[]>("/dashboard/calls", accessToken);
}

export function getSmsThread(accessToken: string, leadId: string) {
  return apiFetch<SMSMessage[]>(`/dashboard/sms/${leadId}`, accessToken);
}

export function getAppointments(accessToken: string) {
  return apiFetch<Appointment[]>("/dashboard/appointments", accessToken);
}

export function createAppointment(
  accessToken: string,
  input: Pick<Appointment, "lead_id" | "scheduled_date" | "scheduled_time" | "service_type" | "notes">,
) {
  return apiFetch<Appointment>("/dashboard/appointments", accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAppointmentStatus(
  accessToken: string,
  appointmentId: string,
  status: Exclude<AppointmentStatus, "completed">,
) {
  return apiFetch<Appointment>(`/dashboard/appointments/${appointmentId}/status`, accessToken, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function completeAppointment(
  accessToken: string,
  appointmentId: string,
  input: { actual_revenue: number; send_review_request: boolean },
) {
  return apiFetch<Appointment>(`/dashboard/appointments/${appointmentId}/complete`, accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getStats(accessToken: string) {
  return apiFetch<DashboardStats>("/dashboard/stats", accessToken);
}

export function getRevenueAnalytics(accessToken: string, days = 30) {
  return apiFetch<RevenueAnalytics>(`/dashboard/analytics/revenue?days=${encodeURIComponent(days)}`, accessToken);
}
