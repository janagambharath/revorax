"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  DollarSign,
  FileText,
  Inbox,
  LoaderCircle,
  LogOut,
  MapPin,
  MessageSquare,
  Phone,
  PhoneCall,
  RefreshCw,
  Settings2,
  Sparkles,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import {
  ApiError,
  type Appointment,
  type AppointmentStatus,
  type Business,
  type BusinessHours,
  type BusinessInput,
  type CallLog,
  type DashboardStats,
  type Lead,
  type LeadStatus,
  type RevenueAnalytics,
  type SMSMessage,
  type User,
  clearStoredTokens,
  completeAppointment,
  createAppointment,
  createBusiness,
  getAppointments,
  getBusiness,
  getCalls,
  getCurrentUser,
  getLead,
  getLeads,
  getRevenueAnalytics,
  getSmsThread,
  getStats,
  getStoredTokens,
  scheduleLeadCallback,
  sendLeadSms,
  updateAppointmentStatus,
  updateBusiness,
  updateLeadStatus,
} from "@/lib/revorax-api";

type DashboardView = "inbox" | "calls" | "appointments" | "settings";
type LoadState = "loading" | "ready" | "onboarding" | "error";
type LeadFilter = "all" | LeadStatus;

const leadStatuses: LeadStatus[] = ["new", "contacted", "booked", "lost"];
const appointmentStatuses: Exclude<AppointmentStatus, "completed">[] = ["confirmed", "reminded", "no_show", "cancelled"];

const statusClass: Record<string, string> = {
  new: "bg-rvx-peach text-rvx-signal",
  contacted: "bg-rvx-lilac-soft text-rvx-violet",
  booked: "bg-rvx-mint text-rvx-recovered",
  lost: "bg-[#F1F3F1] text-rvx-slate",
  confirmed: "bg-rvx-mint text-rvx-recovered",
  reminded: "bg-rvx-lilac-soft text-rvx-violet",
  completed: "bg-[#EAF5FB] text-[#28759A]",
  no_show: "bg-rvx-peach text-rvx-signal",
  cancelled: "bg-[#F1F3F1] text-rvx-slate",
  emergency: "bg-rvx-peach text-rvx-signal",
  soon: "bg-rvx-lilac-soft text-rvx-violet",
  flexible: "bg-rvx-mint text-rvx-recovered",
  unknown: "bg-[#F1F3F1] text-rvx-slate",
};

const navItems: Array<{ id: DashboardView; label: string; icon: typeof Inbox }> = [
  { id: "inbox", label: "Lead inbox", icon: Inbox },
  { id: "calls", label: "Call history", icon: PhoneCall },
  { id: "appointments", label: "Appointments", icon: CalendarDays },
  { id: "settings", label: "Business settings", icon: Settings2 },
];

function titleCase(value: string | null | undefined) {
  if (!value) return "Not captured";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date pending";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(year, month - 1, day));
}

function formatTime(value: string | null | undefined) {
  if (!value) return "Time pending";
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
  const date = new Date(2000, 0, 1, hours, minutes);
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatPhone(value: string | null | undefined) {
  if (!value) return "Not captured";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return value;
}

function initials(value: string | null | undefined) {
  const letters = (value || "Caller").split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2);
  return letters.toUpperCase() || "C";
}

function StatusPill({ value }: { value: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] ${statusClass[value] ?? "bg-[#F1F3F1] text-rvx-slate"}`}>{titleCase(value)}</span>;
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-rvx-ink text-white">
        <span className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-rvx-signal" />
        <PhoneCall className="relative h-[18px] w-[18px]" strokeWidth={2.4} />
      </span>
      <span className="text-[1.12rem] font-bold tracking-[-0.055em] text-rvx-ink">revorax</span>
    </div>
  );
}

function MetricCard({ label, value, detail, tone = "default", icon: Icon }: { label: string; value: number | string; detail: string; tone?: "default" | "alert" | "mint"; icon: typeof Activity }) {
  const toneClass = tone === "alert" ? "bg-rvx-peach" : tone === "mint" ? "bg-rvx-mint" : "bg-white";
  const iconClass = tone === "alert" ? "bg-white text-rvx-signal" : tone === "mint" ? "bg-white text-rvx-recovered" : "bg-rvx-lilac-soft text-rvx-violet";
  return (
    <div className={`min-w-0 rounded-[21px] border border-rvx-border p-4 shadow-[0_9px_24px_rgba(24,44,35,0.035)] ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.11em] text-rvx-slate">{label}</p>
          <p className="mt-3 text-3xl font-bold leading-none tracking-[-0.06em] text-rvx-ink">{value}</p>
        </div>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${iconClass}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-3 text-[11px] leading-4 text-rvx-slate">{detail}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }: { icon: typeof Inbox; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="grid min-h-[280px] place-items-center rounded-[22px] border border-dashed border-rvx-border bg-[#FCFDFB] px-6 py-10 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-rvx-mint text-rvx-recovered"><Icon className="h-5 w-5" /></span>
        <h3 className="mt-5 text-base font-bold tracking-[-0.035em] text-rvx-ink">{title}</h3>
        <p className="mt-2 text-[13px] leading-6 text-rvx-slate">{description}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

function LoadingWorkspace() {
  return (
    <main className="grid min-h-screen place-items-center bg-rvx-canvas px-5">
      <div className="flex items-center gap-3 rounded-2xl border border-rvx-border bg-white px-5 py-4 shadow-[0_18px_42px_rgba(24,44,35,0.08)]">
        <LoaderCircle className="h-4 w-4 animate-spin text-rvx-signal" />
        <span className="text-sm font-bold text-rvx-ink">Opening your operations desk…</span>
      </div>
    </main>
  );
}

function InlineError({ children }: { children: React.ReactNode }) {
  return <div className="flex items-start gap-2 rounded-xl border border-rvx-signal/25 bg-rvx-peach px-3 py-2.5 text-[12px] leading-5 text-rvx-signal"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{children}</div>;
}

function Onboarding({ user, onComplete, onSignOut }: { user: User | null; onComplete: (input: BusinessInput) => Promise<void>; onSignOut: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setSubmitting(true);
    try {
      await onComplete({
        name: String(form.get("name") || "").trim(),
        zip_code: String(form.get("zip_code") || "").trim() || undefined,
        business_phone: String(form.get("business_phone") || "").trim() || undefined,
        city: String(form.get("city") || "").trim() || undefined,
        state: String(form.get("state") || "").trim().toUpperCase() || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not create your business workspace.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-rvx-canvas px-5 py-7 sm:px-7 lg:px-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" aria-label="Revorax home"><BrandMark /></Link>
        <button type="button" onClick={onSignOut} className="text-[12px] font-bold text-rvx-slate transition hover:text-rvx-ink">Sign out</button>
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl overflow-hidden rounded-[30px] border border-rvx-border bg-white shadow-[0_28px_75px_rgba(24,44,35,0.09)] lg:grid-cols-[0.93fr_1.07fr]">
        <section className="relative overflow-hidden bg-rvx-ink p-7 text-white sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rvx-violet/70 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-60 w-60 rounded-full bg-rvx-signal/40 blur-[75px]" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-rvx-mint"><span className="h-1.5 w-1.5 rounded-full bg-rvx-recovered" /> One-time setup</p>
            <h1 className="mt-5 max-w-sm text-4xl font-bold leading-[1.02] tracking-[-0.06em]">Set up the desk your team will work from.</h1>
            <p className="mt-5 max-w-sm text-[14px] leading-6 text-white/65">Revorax needs a few details to organize leads, calls, and appointment activity for your business.</p>
            <div className="mt-10 space-y-4">
              {[
                [Building2, "Business profile", "Name and local details create your workspace."],
                [PhoneCall, "Call routing", "Your phone connection is added separately in settings."],
                [Inbox, "Lead desk", "New activity appears here as calls and messages arrive."],
              ].map(([Icon, title, detail]) => {
                const StepIcon = Icon as typeof Building2;
                return <div key={title as string} className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-rvx-mint"><StepIcon className="h-4 w-4" /></span><div><p className="text-[12px] font-bold">{title as string}</p><p className="mt-0.5 text-[11px] leading-5 text-white/55">{detail as string}</p></div></div>;
              })}
            </div>
          </div>
        </section>
        <section className="p-7 sm:p-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-rvx-slate">Welcome{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.055em] text-rvx-ink">Create your business workspace.</h2>
          <p className="mt-3 max-w-md text-[13px] leading-6 text-rvx-slate">You can complete the rest of your services, hours, and greeting from Business settings once you are in.</p>
          <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
            <label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink">Business name<input required name="name" autoComplete="organization" placeholder="Northside Heating & Air" className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label>
            <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
              <label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink">Business phone<input name="business_phone" type="tel" autoComplete="tel" placeholder="(555) 555-0123" className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label>
              <label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink">ZIP code<input name="zip_code" inputMode="numeric" autoComplete="postal-code" placeholder="78701" className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_74px]">
              <label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink">City<input name="city" autoComplete="address-level2" placeholder="Austin" className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label>
              <label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink">State<input name="state" maxLength={2} autoComplete="address-level1" placeholder="TX" className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium uppercase outline-none transition focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label>
            </div>
            {error && <InlineError>{error}</InlineError>}
            <button disabled={submitting} className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-rvx-ink px-4 text-[13px] font-bold text-white transition hover:bg-rvx-signal disabled:cursor-not-allowed disabled:opacity-65">{submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}{submitting ? "Creating workspace…" : "Open my operations desk"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}

function LeadInbox({ leads, activeLeadId, leadFilter, onFilterChange, onSelectLead }: { leads: Lead[]; activeLeadId: string | null; leadFilter: LeadFilter; onFilterChange: (filter: LeadFilter) => void; onSelectLead: (leadId: string) => void }) {
  const filteredLeads = leadFilter === "all" ? leads : leads.filter((lead) => lead.status === leadFilter);
  return (
    <section className="rounded-[24px] border border-rvx-border bg-white shadow-[0_10px_28px_rgba(24,44,35,0.035)]">
      <div className="border-b border-rvx-border px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-[15px] font-bold tracking-[-0.025em] text-rvx-ink">Lead inbox</h2><p className="mt-0.5 text-[11px] text-rvx-slate">Prioritize the callers who need a next step.</p></div>
          <div className="inline-flex rounded-xl border border-rvx-border bg-rvx-canvas p-1" aria-label="Filter lead inbox">
            {(["all", ...leadStatuses] as LeadFilter[]).map((filter) => <button type="button" key={filter} onClick={() => onFilterChange(filter)} className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold capitalize transition ${leadFilter === filter ? "bg-white text-rvx-ink shadow-sm" : "text-rvx-slate hover:text-rvx-ink"}`}>{filter === "all" ? "All" : titleCase(filter)}</button>)}
          </div>
        </div>
      </div>
      <div className="max-h-[570px] overflow-y-auto p-2.5">
        {filteredLeads.length ? filteredLeads.map((lead) => {
          const active = activeLeadId === lead.id;
          return <button type="button" key={lead.id} onClick={() => onSelectLead(lead.id)} className={`mb-1.5 grid w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-3 text-left transition last:mb-0 ${active ? "bg-rvx-mint ring-1 ring-rvx-recovered/20" : "hover:bg-rvx-canvas"}`}>
            <span className={`grid h-10 w-10 place-items-center rounded-xl text-[11px] font-bold ${active ? "bg-white text-rvx-recovered" : "bg-rvx-lilac-soft text-rvx-violet"}`}>{initials(lead.caller_name)}</span>
            <span className="min-w-0"><span className="flex items-center gap-2"><span className="truncate text-[13px] font-bold text-rvx-ink">{lead.caller_name || formatPhone(lead.caller_phone)}</span>{lead.urgency === "emergency" && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rvx-signal" />}</span><span className="mt-1 block truncate text-[11px] text-rvx-slate">{lead.service_type || lead.ai_summary || "Awaiting qualification"}</span></span>
            <span className="grid justify-items-end gap-1.5"><StatusPill value={lead.status} /><span className="text-[10px] text-rvx-slate">{formatDateTime(lead.created_at)}</span></span>
          </button>;
        }) : <EmptyState icon={Inbox} title="No leads in this view" description={leadFilter === "all" ? "When a call or message creates a lead, it will show up here." : `No ${leadFilter} leads are waiting right now.`} />}
      </div>
    </section>
  );
}

function LeadDetail({
  lead,
  smsMessages,
  loading,
  onUpdateStatus,
  onCreateAppointment,
  onSendSms,
  onScheduleCallback,
}: {
  lead: Lead | null;
  smsMessages: SMSMessage[];
  loading: boolean;
  onUpdateStatus: (status: LeadStatus) => void;
  onCreateAppointment: (input: { scheduled_date: string; scheduled_time: string; service_type: string; notes: string }) => Promise<void>;
  onSendSms: (body: string) => Promise<void>;
  onScheduleCallback: (input: { scheduled_for?: string; notes?: string }) => Promise<void>;
}) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSaving, setBookingSaving] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsSaving, setSmsSaving] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [callbackSaving, setCallbackSaving] = useState(false);
  const [callbackError, setCallbackError] = useState<string | null>(null);

  if (loading) return <section className="grid min-h-[450px] place-items-center rounded-[24px] border border-rvx-border bg-white"><LoaderCircle className="h-5 w-5 animate-spin text-rvx-signal" /></section>;
  if (!lead) return <EmptyState icon={UserRound} title="Choose a lead to see the context" description="Review the AI summary, caller details, text thread, and next action in one place." />;

  async function submitAppointment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBookingSaving(true);
    setBookingError(null);
    try {
      await onCreateAppointment({
        scheduled_date: String(form.get("scheduled_date") || ""),
        scheduled_time: String(form.get("scheduled_time") || ""),
        service_type: String(form.get("service_type") || "").trim(),
        notes: String(form.get("notes") || "").trim(),
      });
      setBookingOpen(false);
    } catch (cause) {
      setBookingError(cause instanceof Error ? cause.message : "Unable to create the appointment.");
    } finally {
      setBookingSaving(false);
    }
  }

  async function submitSms(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = String(form.get("body") || "").trim();
    if (!body) return;
    setSmsSaving(true);
    setSmsError(null);
    try {
      await onSendSms(body);
      setSmsOpen(false);
    } catch (cause) {
      setSmsError(cause instanceof Error ? cause.message : "Unable to queue this text.");
    } finally {
      setSmsSaving(false);
    }
  }

  async function submitCallback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const scheduledFor = String(form.get("scheduled_for") || "").trim();
    let scheduledForIso: string | undefined;
    if (scheduledFor) {
      const parsed = new Date(scheduledFor);
      if (Number.isNaN(parsed.getTime())) {
        setCallbackError("Choose a valid callback time.");
        return;
      }
      scheduledForIso = parsed.toISOString();
    }
    setCallbackSaving(true);
    setCallbackError(null);
    try {
      await onScheduleCallback({
        scheduled_for: scheduledForIso,
        notes: String(form.get("notes") || "").trim() || undefined,
      });
      setCallbackOpen(false);
    } catch (cause) {
      setCallbackError(cause instanceof Error ? cause.message : "Unable to schedule this callback.");
    } finally {
      setCallbackSaving(false);
    }
  }

  return <section className="rounded-[24px] border border-rvx-border bg-white shadow-[0_10px_28px_rgba(24,44,35,0.035)]">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-rvx-border p-5">
      <div className="flex min-w-0 gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rvx-ink text-[12px] font-bold text-white">{initials(lead.caller_name)}</span>
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-[17px] font-bold tracking-[-0.04em] text-rvx-ink">{lead.caller_name || "Unknown caller"}</h2><StatusPill value={lead.status} /></div><a href={`tel:${lead.caller_phone}`} className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-semibold text-rvx-slate transition hover:text-rvx-signal"><Phone className="h-3.5 w-3.5" />{formatPhone(lead.caller_phone)}</a></div>
      </div>
      <label className="grid gap-1 text-[9px] font-bold uppercase tracking-[0.1em] text-rvx-slate">Lead status<select value={lead.status} onChange={(event) => onUpdateStatus(event.target.value as LeadStatus)} className="h-9 rounded-lg border border-rvx-border bg-rvx-canvas px-2 text-[11px] font-bold normal-case tracking-normal text-rvx-ink outline-none focus:border-rvx-ink">{leadStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></label>
    </div>

    <div className="space-y-5 p-5">
      <div className="rounded-2xl bg-rvx-ink p-4 text-white">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-rvx-mint"><Sparkles className="h-3.5 w-3.5" /> AI qualification</div>
        <p className="mt-3 text-[13px] leading-6 text-white/80">{lead.ai_summary || "No AI summary is available for this lead yet. Review the caller notes and conversation below."}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          [Wrench, "Service", lead.service_type || "Not captured"],
          [AlertTriangle, "Urgency", titleCase(lead.urgency)],
          [Clock3, "Preferred time", lead.preferred_time || "Not captured"],
          [MapPin, "Address", lead.caller_address || "Not captured"],
          [MapPin, "Service area", lead.zip_code || "Not captured"],
          [MessageSquare, "Text consent", titleCase(lead.consent_status)],
        ].map(([Icon, label, value]) => {
          const DetailIcon = Icon as typeof Wrench;
          return <div key={label as string} className="flex items-center gap-3 rounded-xl border border-rvx-border bg-rvx-canvas px-3 py-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-rvx-violet shadow-sm"><DetailIcon className="h-3.5 w-3.5" /></span><span><span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-rvx-slate">{label as string}</span><span className="mt-0.5 block text-[12px] font-bold text-rvx-ink">{value as string}</span></span></div>;
        })}
      </div>

      {(lead.notes || lead.transcript) && <div className="rounded-2xl border border-rvx-border bg-[#FCFDFB] p-4"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-rvx-slate"><FileText className="h-3.5 w-3.5" /> Caller context</p>{lead.notes && <p className="mt-3 text-[12px] leading-6 text-rvx-ink">{lead.notes}</p>}{lead.transcript && <p className="mt-3 border-t border-rvx-border pt-3 text-[12px] leading-6 text-rvx-slate">“{lead.transcript}”</p>}</div>}

      <div>
        <div className="flex items-center justify-between"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-rvx-slate"><MessageSquare className="h-3.5 w-3.5" /> SMS conversation</p><span className="text-[10px] text-rvx-slate">{smsMessages.length} message{smsMessages.length === 1 ? "" : "s"}</span></div>
        <div className="mt-3 max-h-52 space-y-2 overflow-y-auto rounded-2xl bg-[#F8FAF7] p-3">
          {smsMessages.length ? smsMessages.map((message) => <div key={message.id} className={`max-w-[88%] rounded-2xl px-3 py-2.5 text-[11px] leading-5 ${message.direction === "outbound" ? "ml-auto rounded-tr-sm bg-rvx-ink text-white" : "rounded-tl-sm bg-white text-rvx-ink shadow-sm"}`}><p>{message.body}</p><p className={`mt-1 text-[9px] ${message.direction === "outbound" ? "text-white/55" : "text-rvx-slate"}`}>{message.direction === "outbound" ? "Revorax" : lead.caller_name || "Caller"} · {formatDateTime(message.created_at)}</p></div>) : <p className="px-2 py-5 text-center text-[11px] text-rvx-slate">No text messages are attached to this lead yet.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-rvx-border bg-rvx-canvas p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-[12px] font-bold text-rvx-ink">Customer actions</p><p className="mt-1 text-[10px] leading-5 text-rvx-slate">Call now, queue a consent-safe text, or put a callback in the owner queue.</p></div>
          <a href={`tel:${lead.caller_phone}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rvx-border bg-white px-3 text-[11px] font-bold text-rvx-ink transition hover:border-rvx-ink"><Phone className="h-3.5 w-3.5" />Call</a>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => { setSmsOpen((open) => !open); setCallbackOpen(false); setSmsError(null); }} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-rvx-ink px-3 text-[11px] font-bold text-white transition hover:bg-rvx-signal"><MessageSquare className="h-3.5 w-3.5" />Text customer</button>
          <button type="button" onClick={() => { setCallbackOpen((open) => !open); setSmsOpen(false); setCallbackError(null); }} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rvx-border bg-white px-3 text-[11px] font-bold text-rvx-ink transition hover:border-rvx-ink"><Clock3 className="h-3.5 w-3.5" />Schedule callback</button>
        </div>
        {smsOpen && <form onSubmit={submitSms} className="mt-3 rounded-xl border border-rvx-border bg-white p-3"><div className="flex items-center justify-between gap-3"><p className="text-[11px] font-bold text-rvx-ink">Send a customer-service text</p><button type="button" onClick={() => setSmsOpen(false)} className="text-rvx-slate transition hover:text-rvx-ink" aria-label="Close text form"><X className="h-4 w-4" /></button></div><textarea required name="body" maxLength={1600} rows={3} placeholder="Write a clear, helpful update…" className="mt-3 w-full resize-y rounded-lg border border-rvx-border bg-rvx-canvas px-3 py-2 text-[12px] outline-none focus:border-rvx-ink" />{smsError && <div className="mt-2"><InlineError>{smsError}</InlineError></div>}<p className="mt-2 text-[10px] leading-5 text-rvx-slate">Revorax blocks this action when the customer has not consented or has opted out.</p><button disabled={smsSaving} className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-rvx-signal px-3 text-[11px] font-bold text-white transition hover:bg-rvx-ink disabled:opacity-60">{smsSaving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}{smsSaving ? "Queuing…" : "Queue text"}</button></form>}
        {callbackOpen && <form onSubmit={submitCallback} className="mt-3 rounded-xl border border-rvx-border bg-white p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-bold text-rvx-ink">Schedule a human callback</p><p className="mt-0.5 text-[10px] text-rvx-slate">Leave the time blank to alert the owner now.</p></div><button type="button" onClick={() => setCallbackOpen(false)} className="text-rvx-slate transition hover:text-rvx-ink" aria-label="Close callback form"><X className="h-4 w-4" /></button></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-[10px] font-bold text-rvx-ink">Callback time<input type="datetime-local" name="scheduled_for" className="h-9 rounded-lg border border-rvx-border bg-rvx-canvas px-2 text-[11px] font-medium outline-none focus:border-rvx-ink" /></label><label className="grid gap-1 text-[10px] font-bold text-rvx-ink">Notes<input name="notes" maxLength={1000} placeholder="What should the owner know?" className="h-9 rounded-lg border border-rvx-border bg-rvx-canvas px-2 text-[11px] font-medium outline-none focus:border-rvx-ink" /></label></div>{callbackError && <div className="mt-2"><InlineError>{callbackError}</InlineError></div>}<button disabled={callbackSaving} className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-rvx-ink px-3 text-[11px] font-bold text-white transition hover:bg-rvx-signal disabled:opacity-60">{callbackSaving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Clock3 className="h-3.5 w-3.5" />}{callbackSaving ? "Scheduling…" : "Schedule callback"}</button></form>}
      </div>

      <div className="border-t border-rvx-border pt-4">
        {!bookingOpen ? <button type="button" onClick={() => setBookingOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-rvx-ink px-4 text-[12px] font-bold text-white transition hover:bg-rvx-signal"><CalendarDays className="h-3.5 w-3.5" />Book appointment</button> : <form onSubmit={submitAppointment} className="rounded-2xl border border-rvx-border bg-rvx-canvas p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[12px] font-bold text-rvx-ink">Schedule this lead</p><p className="mt-0.5 text-[10px] text-rvx-slate">Saving an appointment marks the lead as booked.</p></div><button type="button" onClick={() => setBookingOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-rvx-slate transition hover:bg-white hover:text-rvx-ink" aria-label="Close appointment form"><X className="h-4 w-4" /></button></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-[10px] font-bold text-rvx-ink">Date<input required type="date" name="scheduled_date" defaultValue={new Date().toISOString().slice(0, 10)} className="h-10 rounded-lg border border-rvx-border bg-white px-2 text-[12px] font-medium outline-none focus:border-rvx-ink" /></label><label className="grid gap-1 text-[10px] font-bold text-rvx-ink">Time<input required type="time" name="scheduled_time" className="h-10 rounded-lg border border-rvx-border bg-white px-2 text-[12px] font-medium outline-none focus:border-rvx-ink" /></label><label className="grid gap-1 text-[10px] font-bold text-rvx-ink sm:col-span-2">Service<input name="service_type" defaultValue={lead.service_type || ""} placeholder="AC repair" className="h-10 rounded-lg border border-rvx-border bg-white px-2 text-[12px] font-medium outline-none focus:border-rvx-ink" /></label><label className="grid gap-1 text-[10px] font-bold text-rvx-ink sm:col-span-2">Notes<textarea name="notes" defaultValue={lead.notes || ""} rows={2} className="resize-y rounded-lg border border-rvx-border bg-white px-2 py-2 text-[12px] font-medium outline-none focus:border-rvx-ink" /></label></div>{bookingError && <div className="mt-3"><InlineError>{bookingError}</InlineError></div>}<button disabled={bookingSaving} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-rvx-signal px-4 text-[12px] font-bold text-white transition hover:bg-rvx-ink disabled:cursor-not-allowed disabled:opacity-65">{bookingSaving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}{bookingSaving ? "Booking…" : "Confirm appointment"}</button></form>}
      </div>
    </div>
  </section>;
}

function CallsView({ calls, leads, onSelectLead }: { calls: CallLog[]; leads: Lead[]; onSelectLead: (leadId: string) => void }) {
  const leadMap = useMemo(() => new Map(leads.map((lead) => [lead.id, lead])), [leads]);
  if (!calls.length) return <EmptyState icon={PhoneCall} title="No calls have been logged yet" description="As calls come through your Revorax number, their history and outcome will be visible here." />;
  return <section className="overflow-hidden rounded-[24px] border border-rvx-border bg-white shadow-[0_10px_28px_rgba(24,44,35,0.035)]"><div className="flex items-center justify-between border-b border-rvx-border px-5 py-4"><div><h2 className="text-[15px] font-bold tracking-[-0.025em] text-rvx-ink">Call history</h2><p className="mt-0.5 text-[11px] text-rvx-slate">Incoming and outgoing activity across your business.</p></div><span className="rounded-full bg-rvx-mint px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-rvx-recovered">{calls.length} logged</span></div><div className="divide-y divide-rvx-border">{calls.map((call) => { const linkedLead = call.lead_id ? leadMap.get(call.lead_id) : null; return <article key={call.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4"><span className={`grid h-9 w-9 place-items-center rounded-xl ${call.status === "missed" ? "bg-rvx-peach text-rvx-signal" : call.status === "voicemail" ? "bg-rvx-lilac-soft text-rvx-violet" : "bg-rvx-mint text-rvx-recovered"}`}><PhoneCall className="h-4 w-4" /></span><div className="min-w-[180px] flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-[12px] font-bold text-rvx-ink">{formatPhone(call.from_number)}</p><StatusPill value={call.status} /></div><p className="mt-1 text-[11px] text-rvx-slate">{titleCase(call.direction)} · {formatDateTime(call.created_at)}{call.duration_seconds !== null ? ` · ${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : ""}</p></div>{call.transcription && <p className="hidden max-w-[320px] truncate text-[11px] text-rvx-slate lg:block">“{call.transcription}”</p>}{linkedLead ? <button type="button" onClick={() => onSelectLead(linkedLead.id)} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rvx-ink transition hover:text-rvx-signal">Open {linkedLead.caller_name || "lead"}<ChevronRight className="h-3.5 w-3.5" /></button> : <span className="text-[10px] font-medium text-rvx-slate">No linked lead</span>}</article>; })}</div></section>;
}

function LegacyAppointmentsView({ appointments, leads, onUpdate }: { appointments: Appointment[]; leads: Lead[]; onUpdate: (id: string, status: AppointmentStatus) => void }) {
  const leadMap = useMemo(() => new Map(leads.map((lead) => [lead.id, lead])), [leads]);
  if (!appointments.length) return <EmptyState icon={CalendarDays} title="No appointments scheduled" description="Book an appointment from a lead detail and it will appear here with its current status." />;
  return <section className="overflow-hidden rounded-[24px] border border-rvx-border bg-white shadow-[0_10px_28px_rgba(24,44,35,0.035)]"><div className="flex items-center justify-between border-b border-rvx-border px-5 py-4"><div><h2 className="text-[15px] font-bold tracking-[-0.025em] text-rvx-ink">Appointments</h2><p className="mt-0.5 text-[11px] text-rvx-slate">Track confirmed work, reminders, and completed visits.</p></div><span className="rounded-full bg-rvx-lilac-soft px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-rvx-violet">{appointments.length} total</span></div><div className="divide-y divide-rvx-border">{appointments.map((appointment) => { const lead = appointment.lead_id ? leadMap.get(appointment.lead_id) : null; return <article key={appointment.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-rvx-mint text-rvx-recovered"><CalendarDays className="h-4 w-4" /></span><div className="min-w-[190px] flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-[12px] font-bold text-rvx-ink">{appointment.service_type || "Service visit"}</p><StatusPill value={appointment.status} /></div><p className="mt-1 text-[11px] text-rvx-slate">{formatDate(appointment.scheduled_date)} · {formatTime(appointment.scheduled_time)}{lead ? ` · ${lead.caller_name || formatPhone(lead.caller_phone)}` : ""}</p>{appointment.notes && <p className="mt-1 max-w-xl truncate text-[11px] text-rvx-slate">{appointment.notes}</p>}</div><label className="grid gap-1 text-[9px] font-bold uppercase tracking-[0.1em] text-rvx-slate">Status<select value={appointment.status} onChange={(event) => onUpdate(appointment.id, event.target.value as AppointmentStatus)} className="h-9 rounded-lg border border-rvx-border bg-rvx-canvas px-2 text-[11px] font-bold normal-case tracking-normal text-rvx-ink outline-none focus:border-rvx-ink">{appointmentStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></label></article>; })}</div></section>;
}

function CompletionPanel({
  appointment,
  reviewRequestsEnabled,
  onComplete,
  onClose,
}: {
  appointment: Appointment;
  reviewRequestsEnabled: boolean;
  onComplete: (appointmentId: string, input: { actual_revenue: number; send_review_request: boolean }) => Promise<void>;
  onClose: () => void;
}) {
  const [revenue, setRevenue] = useState(appointment.actual_revenue?.toFixed(2) ?? "");
  const [sendReviewRequest, setSendReviewRequest] = useState(reviewRequestsEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(revenue);
    if (!revenue.trim() || !Number.isFinite(value) || value < 0) {
      setError("Enter the final job revenue as a zero or positive amount.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onComplete(appointment.id, {
        actual_revenue: Math.round(value * 100) / 100,
        send_review_request: reviewRequestsEnabled && sendReviewRequest,
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not complete this job.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-2xl border border-rvx-recovered/20 bg-rvx-mint/45 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[12px] font-bold text-rvx-ink"><CheckCircle2 className="h-4 w-4 text-rvx-recovered" />Complete this job</p>
          <p className="mt-1 text-[11px] leading-5 text-rvx-slate">Record realized revenue once. This also keeps your CRM and revenue analytics current.</p>
        </div>
        <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-rvx-slate transition hover:bg-white hover:text-rvx-ink" aria-label="Close completion form"><X className="h-4 w-4" /></button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-end">
        <label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-rvx-slate">Actual revenue (USD)<input required min="0" step="0.01" inputMode="decimal" type="number" value={revenue} onChange={(event) => setRevenue(event.target.value)} placeholder="0.00" className="h-10 rounded-xl border border-rvx-border bg-white px-3 text-[13px] font-bold normal-case tracking-normal text-rvx-ink outline-none transition focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label>
        {reviewRequestsEnabled ? <label className="flex min-h-10 items-center gap-2 rounded-xl border border-rvx-border bg-white px-3 text-[11px] font-semibold text-rvx-ink"><input type="checkbox" checked={sendReviewRequest} onChange={(event) => setSendReviewRequest(event.target.checked)} className="h-4 w-4 accent-rvx-ink" />Schedule the approved review request</label> : <p className="text-[11px] leading-5 text-rvx-slate">Review requests are off in workflow controls. You can enable them in Settings at any time.</p>}
      </div>
      {error && <div className="mt-3"><InlineError>{error}</InlineError></div>}
      <button disabled={saving} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-rvx-ink px-4 text-[12px] font-bold text-white transition hover:bg-rvx-signal disabled:cursor-not-allowed disabled:opacity-65">{saving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <DollarSign className="h-3.5 w-3.5" />}{saving ? "Recording revenue…" : "Complete job and record revenue"}</button>
    </form>
  );
}

function AppointmentsView({
  appointments,
  leads,
  revenueAnalytics,
  reviewRequestsEnabled,
  onUpdate,
  onComplete,
}: {
  appointments: Appointment[];
  leads: Lead[];
  revenueAnalytics: RevenueAnalytics | null;
  reviewRequestsEnabled: boolean;
  onUpdate: (id: string, status: Exclude<AppointmentStatus, "completed">) => void;
  onComplete: (appointmentId: string, input: { actual_revenue: number; send_review_request: boolean }) => Promise<void>;
}) {
  const [completionTargetId, setCompletionTargetId] = useState<string | null>(null);
  const leadMap = useMemo(() => new Map(leads.map((lead) => [lead.id, lead])), [leads]);

  if (!appointments.length) {
    return <LegacyAppointmentsView appointments={appointments} leads={leads} onUpdate={(id, status) => onUpdate(id, status as Exclude<AppointmentStatus, "completed">)} />;
  }

  return (
    <div className="grid gap-5">
      {revenueAnalytics && <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Realized revenue" value={formatCurrency(revenueAnalytics.realized_revenue)} detail="Completed jobs in the last 30 days" tone="mint" icon={DollarSign} /><MetricCard label="Pipeline value" value={formatCurrency(revenueAnalytics.estimated_pipeline_value)} detail="Open lead value in the last 30 days" icon={Activity} /><MetricCard label="Booked conversion" value={`${revenueAnalytics.conversion_rate.toFixed(1)}%`} detail={`${revenueAnalytics.booked_leads} of ${revenueAnalytics.leads} leads booked`} icon={ArrowRight} /><MetricCard label="Completed jobs" value={revenueAnalytics.completed_jobs} detail="Revenue is recorded when a job closes" icon={CheckCircle2} /></section>}
      <section className="overflow-hidden rounded-[24px] border border-rvx-border bg-white shadow-[0_10px_28px_rgba(24,44,35,0.035)]">
        <div className="flex items-center justify-between border-b border-rvx-border px-5 py-4"><div><h2 className="text-[15px] font-bold tracking-[-0.025em] text-rvx-ink">Appointments</h2><p className="mt-0.5 text-[11px] text-rvx-slate">Track confirmed work, record completed revenue, and schedule compliant review follow-up.</p></div><span className="rounded-full bg-rvx-lilac-soft px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-rvx-violet">{appointments.length} total</span></div>
        <div className="divide-y divide-rvx-border">
          {appointments.map((appointment) => {
            const lead = appointment.lead_id ? leadMap.get(appointment.lead_id) : null;
            const canComplete = appointment.status === "confirmed" || appointment.status === "reminded";
            const completionOpen = completionTargetId === appointment.id;
            return <article key={appointment.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-rvx-mint text-rvx-recovered"><CalendarDays className="h-4 w-4" /></span><div className="min-w-[190px] flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-[12px] font-bold text-rvx-ink">{appointment.service_type || "Service visit"}</p><StatusPill value={appointment.status} /></div><p className="mt-1 text-[11px] text-rvx-slate">{formatDate(appointment.scheduled_date)} · {formatTime(appointment.scheduled_time)}{lead ? ` · ${lead.caller_name || formatPhone(lead.caller_phone)}` : ""}</p>{appointment.notes && <p className="mt-1 max-w-xl truncate text-[11px] text-rvx-slate">{appointment.notes}</p>}{appointment.status === "completed" && <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-rvx-recovered"><DollarSign className="h-3.5 w-3.5" />{formatCurrency(appointment.actual_revenue)} recorded</p>}</div>{appointment.status === "completed" ? <span className="rounded-lg bg-rvx-mint px-3 py-2 text-[10px] font-bold text-rvx-recovered">Revenue recorded</span> : <div className="flex flex-wrap items-end gap-2"><label className="grid gap-1 text-[9px] font-bold uppercase tracking-[0.1em] text-rvx-slate">Status<select value={appointment.status} onChange={(event) => onUpdate(appointment.id, event.target.value as Exclude<AppointmentStatus, "completed">)} className="h-9 rounded-lg border border-rvx-border bg-rvx-canvas px-2 text-[11px] font-bold normal-case tracking-normal text-rvx-ink outline-none focus:border-rvx-ink">{appointmentStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></label>{canComplete && <button type="button" onClick={() => setCompletionTargetId(completionOpen ? null : appointment.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-rvx-ink px-3 text-[10px] font-bold text-white transition hover:bg-rvx-signal"><CheckCircle2 className="h-3.5 w-3.5" />Complete job</button>}</div>}{completionOpen && <div className="basis-full"><CompletionPanel appointment={appointment} reviewRequestsEnabled={reviewRequestsEnabled} onComplete={onComplete} onClose={() => setCompletionTargetId(null)} /></div>}</article>;
          })}
        </div>
      </section>
    </div>
  );
}

function SettingsView({ business, onSave }: { business: Business; onSave: (input: Partial<BusinessInput>) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      await onSave({
        name: String(form.get("name") || "").trim(),
        business_phone: String(form.get("business_phone") || "").trim() || undefined,
        address: String(form.get("address") || "").trim() || undefined,
        city: String(form.get("city") || "").trim() || undefined,
        state: String(form.get("state") || "").trim().toUpperCase() || undefined,
        zip_code: String(form.get("zip_code") || "").trim() || undefined,
        website: String(form.get("website") || "").trim() || undefined,
        timezone: String(form.get("timezone") || "").trim() || undefined,
        greeting_message: String(form.get("greeting_message") || "").trim() || undefined,
        services_offered: String(form.get("services_offered") || "").split("\n").map((item) => item.trim()).filter(Boolean),
      });
      setSuccess(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not save those settings.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_270px]"><form onSubmit={handleSubmit} className="rounded-[24px] border border-rvx-border bg-white p-5 shadow-[0_10px_28px_rgba(24,44,35,0.035)] sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-rvx-border pb-5"><div><h2 className="text-[17px] font-bold tracking-[-0.04em] text-rvx-ink">Business settings</h2><p className="mt-1 text-[12px] leading-5 text-rvx-slate">This is what anchors Revorax’s business context and customer-facing messages.</p></div><StatusPill value={business.status} /></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink sm:col-span-2">Business name<input required name="name" defaultValue={business.name} className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label><label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink">Business phone<input name="business_phone" type="tel" defaultValue={business.business_phone || ""} className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label><label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink">Website<input name="website" type="url" defaultValue={business.website || ""} placeholder="https://…" className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label><label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink sm:col-span-2">Street address<input name="address" autoComplete="street-address" defaultValue={business.address || ""} className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label><label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink">City<input name="city" autoComplete="address-level2" defaultValue={business.city || ""} className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label><div className="grid grid-cols-[0.7fr_1fr] gap-3"><label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink">State<input name="state" maxLength={2} defaultValue={business.state || ""} className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium uppercase outline-none transition focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label><label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink">ZIP code<input name="zip_code" defaultValue={business.zip_code || ""} className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label></div><label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink sm:col-span-2">Timezone<input name="timezone" defaultValue={business.timezone} placeholder="America/Chicago" className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label><label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink sm:col-span-2">Services offered <span className="font-medium text-rvx-slate">(one per line)</span><textarea name="services_offered" defaultValue={business.services_offered?.join("\n") || ""} rows={4} placeholder={"AC repair\nHeating repair\nMaintenance"} className="resize-y rounded-xl border border-rvx-border bg-rvx-canvas px-3 py-3 text-[13px] font-medium outline-none transition focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label><label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink sm:col-span-2">Missed-call greeting<textarea name="greeting_message" defaultValue={business.greeting_message || ""} rows={3} placeholder="Thanks for calling. We missed you…" className="resize-y rounded-xl border border-rvx-border bg-rvx-canvas px-3 py-3 text-[13px] font-medium outline-none transition focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label></div>{error && <div className="mt-4"><InlineError>{error}</InlineError></div>}{success && <div className="mt-4 flex items-center gap-2 rounded-xl border border-rvx-recovered/20 bg-rvx-mint px-3 py-2.5 text-[12px] font-semibold text-rvx-recovered"><CheckCircle2 className="h-4 w-4" /> Settings saved.</div>}<button disabled={saving} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-rvx-ink px-4 text-[12px] font-bold text-white transition hover:bg-rvx-signal disabled:cursor-not-allowed disabled:opacity-65">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? "Saving…" : "Save business settings"}</button></form><aside className="h-fit rounded-[24px] bg-rvx-ink p-5 text-white"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-rvx-mint">Connection status</p><h3 className="mt-3 text-xl font-bold tracking-[-0.045em]">Your Revorax line</h3><div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.11em] text-white/50">Provisioned number</p><p className="mt-2 text-[14px] font-bold text-white">{business.twilio_phone_number ? formatPhone(business.twilio_phone_number) : "Not provisioned"}</p><p className="mt-2 text-[11px] leading-5 text-white/55">Calls and messages sent to this number are captured in your operations desk.</p></div><div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.11em] text-white/50">Business plan</p><p className="mt-2 text-[14px] font-bold text-white">Revorax {titleCase(business.plan)}</p><p className="mt-2 text-[11px] leading-5 text-white/55">For connection support or plan questions, contact the Revorax team.</p></div></aside></section>;
}

type BusinessDayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type BusinessDayHours = { open: string; close: string; closed: boolean };
type HoursDraft = Record<BusinessDayKey, BusinessDayHours>;
type FaqDraft = { question: string; answer: string };

const businessDays: Array<{ key: BusinessDayKey; label: string }> = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

function makeHoursDraft(hours: BusinessHours | null): HoursDraft {
  return businessDays.reduce((draft, { key }) => {
    const configured = hours?.[key];
    draft[key] = {
      open: configured?.open || "08:00",
      close: configured?.close || "17:00",
      closed: configured?.closed === true || (!configured && (key === "sat" || key === "sun")),
    };
    return draft;
  }, {} as HoursDraft);
}

function makeFaqDrafts(faqs: Business["faqs"]): FaqDraft[] {
  if (!Array.isArray(faqs)) return [];
  return faqs
    .filter((faq) => faq && typeof faq.question === "string" && typeof faq.answer === "string")
    .map((faq) => ({ question: faq.question, answer: faq.answer }));
}

function WorkflowRulesSettings({ business, onSave }: { business: Business; onSave: (input: Partial<BusinessInput>) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hours, setHours] = useState<HoursDraft>(() => makeHoursDraft(business.business_hours));
  const [faqs, setFaqs] = useState<FaqDraft[]>(() => makeFaqDrafts(business.faqs));
  const [autoBookingEnabled, setAutoBookingEnabled] = useState(business.auto_booking_enabled);
  const [reviewRequestEnabled, setReviewRequestEnabled] = useState(business.review_request_enabled);

  function updateHours(day: BusinessDayKey, patch: Partial<BusinessDayHours>) {
    setHours((current) => ({ ...current, [day]: { ...current[day], ...patch } }));
  }

  function updateFaq(index: number, patch: Partial<FaqDraft>) {
    setFaqs((current) => current.map((faq, currentIndex) => currentIndex === index ? { ...faq, ...patch } : faq));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const configuredHours = {} as BusinessHours;

    for (const { key, label } of businessDays) {
      const day = hours[key];
      if (day.closed) {
        configuredHours[key] = { closed: true };
        continue;
      }
      if (!day.open || !day.close || day.open >= day.close) {
        setError(`${label} needs a valid opening and closing time, or mark it closed.`);
        return;
      }
      configuredHours[key] = { open: day.open, close: day.close };
    }

    const cleanedFaqs = faqs
      .map((faq) => ({ question: faq.question.trim(), answer: faq.answer.trim() }))
      .filter((faq) => faq.question || faq.answer);
    if (cleanedFaqs.some((faq) => !faq.question || !faq.answer)) {
      setError("Each FAQ needs both a customer question and an approved answer.");
      return;
    }

    const slotMinutes = Number(form.get("appointment_slot_minutes"));
    const minimumNotice = Number(form.get("minimum_notice_minutes"));
    const reviewDelay = Number(form.get("review_request_delay_hours"));
    if (!Number.isInteger(slotMinutes) || slotMinutes < 15 || slotMinutes > 480) {
      setError("Appointment slots must be between 15 minutes and 8 hours.");
      return;
    }
    if (!Number.isInteger(minimumNotice) || minimumNotice < 0 || minimumNotice > 10080) {
      setError("Minimum booking notice must be between 0 minutes and 7 days.");
      return;
    }
    if (!Number.isInteger(reviewDelay) || reviewDelay < 1 || reviewDelay > 720) {
      setError("Review request delay must be between 1 hour and 30 days.");
      return;
    }

    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      await onSave({
        business_hours: configuredHours,
        service_area_zip_codes: String(form.get("service_area_zip_codes") || "")
          .split(/[\s,]+/)
          .map((zip) => zip.trim())
          .filter(Boolean),
        call_transfer_number: String(form.get("call_transfer_number") || "").trim() || null,
        auto_booking_enabled: autoBookingEnabled,
        appointment_slot_minutes: slotMinutes,
        minimum_notice_minutes: minimumNotice,
        review_request_enabled: reviewRequestEnabled,
        review_request_delay_hours: reviewDelay,
        crm_webhook_url: String(form.get("crm_webhook_url") || "").trim() || null,
        faqs: cleanedFaqs,
      });
      setSuccess(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not save those workflow controls.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[24px] border border-rvx-border bg-white p-5 shadow-[0_10px_28px_rgba(24,44,35,0.035)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rvx-border pb-5">
        <div>
          <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-rvx-violet"><Sparkles className="h-3.5 w-3.5" /> AI workflow controls</p>
          <h2 className="mt-2 text-[17px] font-bold tracking-[-0.04em] text-rvx-ink">How Revorax qualifies and acts on each call.</h2>
          <p className="mt-1 max-w-2xl text-[12px] leading-5 text-rvx-slate">Set the hard business rules before Revorax offers an appointment, routes a caller, sends a follow-up, or syncs your CRM.</p>
        </div>
        <span className="rounded-full bg-rvx-mint px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-rvx-recovered">Owner controls</span>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        <section>
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rvx-lilac-soft text-rvx-violet"><Clock3 className="h-4 w-4" /></span>
            <div><h3 className="text-[14px] font-bold text-rvx-ink">Business hours and availability</h3><p className="mt-1 text-[11px] leading-5 text-rvx-slate">Auto-booking only uses open hours. Your service catalog above is also required before Revorax can book.</p></div>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-rvx-border">
            {businessDays.map(({ key, label }) => {
              const day = hours[key];
              return <div key={key} className="grid gap-3 border-b border-rvx-border px-3 py-3 last:border-b-0 sm:grid-cols-[104px_1fr_1fr_96px] sm:items-center sm:px-4"><p className="text-[12px] font-bold text-rvx-ink">{label}</p><label className="grid gap-1 text-[9px] font-bold uppercase tracking-[0.1em] text-rvx-slate">Open<input aria-label={`${label} opening time`} type="time" value={day.open} disabled={day.closed} onChange={(event) => updateHours(key, { open: event.target.value })} className="h-9 rounded-lg border border-rvx-border bg-rvx-canvas px-2 text-[12px] font-semibold normal-case tracking-normal text-rvx-ink outline-none transition focus:border-rvx-ink disabled:cursor-not-allowed disabled:opacity-45" /></label><label className="grid gap-1 text-[9px] font-bold uppercase tracking-[0.1em] text-rvx-slate">Close<input aria-label={`${label} closing time`} type="time" value={day.close} disabled={day.closed} onChange={(event) => updateHours(key, { close: event.target.value })} className="h-9 rounded-lg border border-rvx-border bg-rvx-canvas px-2 text-[12px] font-semibold normal-case tracking-normal text-rvx-ink outline-none transition focus:border-rvx-ink disabled:cursor-not-allowed disabled:opacity-45" /></label><label className="flex h-9 items-center gap-2 rounded-lg border border-rvx-border bg-rvx-canvas px-2 text-[10px] font-bold text-rvx-slate"><input type="checkbox" checked={day.closed} onChange={(event) => updateHours(key, { closed: event.target.checked })} className="h-3.5 w-3.5 accent-rvx-ink" />Closed</label></div>;
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-rvx-border bg-rvx-canvas p-4">
            <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rvx-mint text-rvx-recovered"><MapPin className="h-4 w-4" /></span><div><h3 className="text-[13px] font-bold text-rvx-ink">Service area</h3><p className="mt-1 text-[11px] leading-5 text-rvx-slate">Only customers in these ZIP codes can receive an auto-booked slot.</p></div></div>
            <label className="mt-4 grid gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-rvx-slate">Covered ZIP codes<textarea name="service_area_zip_codes" defaultValue={business.service_area_zip_codes?.join("\n") || ""} rows={5} placeholder={"78701\n78702\n78703"} className="resize-y rounded-xl border border-rvx-border bg-white px-3 py-2.5 text-[13px] font-medium normal-case tracking-normal text-rvx-ink outline-none transition focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label>
          </div>
          <div className="rounded-2xl border border-rvx-border bg-rvx-canvas p-4">
            <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rvx-peach text-rvx-signal"><Phone className="h-4 w-4" /></span><div><h3 className="text-[13px] font-bold text-rvx-ink">Human handoff</h3><p className="mt-1 text-[11px] leading-5 text-rvx-slate">Calls can transfer to this staffed number during your configured hours.</p></div></div>
            <label className="mt-4 grid gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-rvx-slate">Transfer number<input name="call_transfer_number" type="tel" defaultValue={business.call_transfer_number || ""} placeholder="+1 512 555 0199" className="h-10 rounded-xl border border-rvx-border bg-white px-3 text-[13px] font-medium normal-case tracking-normal text-rvx-ink outline-none transition focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label>
          </div>
        </section>

        <section className="rounded-2xl border border-rvx-border p-4 sm:p-5">
          <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rvx-lilac-soft text-rvx-violet"><CalendarDays className="h-4 w-4" /></span><div><h3 className="text-[14px] font-bold text-rvx-ink">Appointment rules</h3><p className="mt-1 text-[11px] leading-5 text-rvx-slate">Keep automatic bookings conservative. Revorax will fall back to a callback if any required rule is missing.</p></div></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px_150px] sm:items-end">
            <label className="flex min-h-11 items-center gap-3 rounded-xl bg-rvx-mint px-3"><input type="checkbox" checked={autoBookingEnabled} onChange={(event) => setAutoBookingEnabled(event.target.checked)} className="h-4 w-4 accent-rvx-ink" /><span><span className="block text-[12px] font-bold text-rvx-ink">Allow auto-booking</span><span className="mt-0.5 block text-[10px] text-rvx-recovered">Requires hours, services, and ZIP coverage.</span></span></label>
            <label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-rvx-slate">Slot length<select name="appointment_slot_minutes" defaultValue={String(business.appointment_slot_minutes || 60)} className="h-10 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[12px] font-bold normal-case tracking-normal text-rvx-ink outline-none focus:border-rvx-ink">{[15, 30, 45, 60, 90, 120, 180, 240].map((minutes) => <option key={minutes} value={minutes}>{minutes < 60 ? `${minutes} min` : `${minutes / 60} hr${minutes === 60 ? "" : "s"}`}</option>)}</select></label>
            <label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-rvx-slate">Minimum notice<select name="minimum_notice_minutes" defaultValue={String(business.minimum_notice_minutes ?? 60)} className="h-10 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[12px] font-bold normal-case tracking-normal text-rvx-ink outline-none focus:border-rvx-ink">{[0, 15, 30, 60, 120, 240, 480, 1440].map((minutes) => <option key={minutes} value={minutes}>{minutes === 0 ? "No minimum" : minutes < 60 ? `${minutes} min` : `${minutes / 60} hr${minutes === 60 ? "" : "s"}`}</option>)}</select></label>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-rvx-border p-4 sm:p-5">
            <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rvx-mint text-rvx-recovered"><MessageSquare className="h-4 w-4" /></span><div><h3 className="text-[14px] font-bold text-rvx-ink">Post-job review request</h3><p className="mt-1 text-[11px] leading-5 text-rvx-slate">Send only after a job is marked completed and your messaging consent rules allow it.</p></div></div>
            <div className="mt-4 flex flex-wrap items-end gap-4"><label className="flex h-10 items-center gap-2 rounded-xl bg-rvx-mint px-3 text-[12px] font-bold text-rvx-ink"><input type="checkbox" checked={reviewRequestEnabled} onChange={(event) => setReviewRequestEnabled(event.target.checked)} className="h-4 w-4 accent-rvx-ink" />Enable requests</label><label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-rvx-slate">Delay<select name="review_request_delay_hours" defaultValue={String(business.review_request_delay_hours || 24)} className="h-10 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[12px] font-bold normal-case tracking-normal text-rvx-ink outline-none focus:border-rvx-ink">{[1, 2, 4, 8, 12, 24, 48, 72, 120, 168].map((hours) => <option key={hours} value={hours}>{hours < 24 ? `${hours} hr${hours === 1 ? "" : "s"}` : `${hours / 24} day${hours === 24 ? "" : "s"}`}</option>)}</select></label></div>
          </div>
          <div className="rounded-2xl border border-rvx-border p-4 sm:p-5">
            <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rvx-lilac-soft text-rvx-violet"><FileText className="h-4 w-4" /></span><div><h3 className="text-[14px] font-bold text-rvx-ink">CRM event sync</h3><p className="mt-1 text-[11px] leading-5 text-rvx-slate">Revorax will deliver lead, booking, and completion events to your approved endpoint.</p></div></div>
            <label className="mt-4 grid gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-rvx-slate">HTTPS webhook URL<input name="crm_webhook_url" type="url" defaultValue={business.crm_webhook_url || ""} placeholder="https://crm.example.com/hooks/revorax" className="h-10 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium normal-case tracking-normal text-rvx-ink outline-none transition focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label>
          </div>
        </section>

        <section className="rounded-2xl border border-rvx-border p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rvx-peach text-rvx-signal"><Wrench className="h-4 w-4" /></span><div><h3 className="text-[14px] font-bold text-rvx-ink">Approved FAQ answers</h3><p className="mt-1 text-[11px] leading-5 text-rvx-slate">Give the voice assistant concise, owner-approved answers. It will not invent answers outside these rules.</p></div></div><button type="button" onClick={() => setFaqs((current) => [...current, { question: "", answer: "" }])} className="h-9 rounded-lg border border-rvx-border bg-rvx-canvas px-3 text-[10px] font-bold text-rvx-ink transition hover:border-rvx-ink">Add FAQ</button></div>
          <div className="mt-4 grid gap-3">{faqs.length ? faqs.map((faq, index) => <div key={index} className="grid gap-3 rounded-xl border border-rvx-border bg-rvx-canvas p-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto]"><label className="grid gap-1 text-[9px] font-bold uppercase tracking-[0.1em] text-rvx-slate">Customer question<input value={faq.question} onChange={(event) => updateFaq(index, { question: event.target.value })} placeholder="Do you service my area?" className="h-9 rounded-lg border border-rvx-border bg-white px-2.5 text-[12px] font-medium normal-case tracking-normal text-rvx-ink outline-none focus:border-rvx-ink" /></label><label className="grid gap-1 text-[9px] font-bold uppercase tracking-[0.1em] text-rvx-slate">Approved answer<textarea value={faq.answer} onChange={(event) => updateFaq(index, { answer: event.target.value })} rows={2} placeholder="We service the ZIP codes listed in our coverage area." className="resize-y rounded-lg border border-rvx-border bg-white px-2.5 py-2 text-[12px] font-medium normal-case tracking-normal text-rvx-ink outline-none focus:border-rvx-ink" /></label><button type="button" onClick={() => setFaqs((current) => current.filter((_, currentIndex) => currentIndex !== index))} className="self-end rounded-lg px-2 py-2 text-[10px] font-bold text-rvx-slate transition hover:bg-rvx-peach hover:text-rvx-signal">Remove</button></div>) : <p className="rounded-xl bg-rvx-canvas px-3 py-3 text-[11px] text-rvx-slate">No approved FAQs yet. Add answers for the questions your callers ask most.</p>}</div>
        </section>

        {error && <InlineError>{error}</InlineError>}
        {success && <div className="flex items-center gap-2 rounded-xl border border-rvx-recovered/20 bg-rvx-mint px-3 py-2.5 text-[12px] font-semibold text-rvx-recovered"><CheckCircle2 className="h-4 w-4" /> Workflow controls saved. Revorax will use these rules on the next call.</div>}
        <button disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-rvx-ink px-4 text-[12px] font-bold text-white transition hover:bg-rvx-signal disabled:cursor-not-allowed disabled:opacity-65">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? "Saving workflow controlsâ€¦" : "Save workflow controls"}</button>
      </form>
    </section>
  );
}

function PhoneActivationStatus({ business }: { business: Business }) {
  const hasActiveLine = Boolean(business.twilio_phone_number);
  const activationLabel = hasActiveLine ? "Line active" : business.status === "suspended" ? "Activation paused" : "Operator activation pending";

  return (
    <section className={`rounded-[24px] border p-5 shadow-[0_10px_28px_rgba(24,44,35,0.035)] sm:p-6 ${hasActiveLine ? "border-rvx-recovered/20 bg-rvx-mint/35" : "border-rvx-border bg-white"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${hasActiveLine ? "bg-white text-rvx-recovered" : "bg-rvx-lilac-soft text-rvx-violet"}`}><PhoneCall className="h-4 w-4" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-rvx-slate">Tenant phone activation</p><h2 className="mt-1 text-[17px] font-bold tracking-[-0.04em] text-rvx-ink">{hasActiveLine ? "Your Revorax line is ready" : "Your Revorax line is being activated"}</h2><p className="mt-1 max-w-2xl text-[12px] leading-5 text-rvx-slate">Phone activation is managed by a Revorax operator so routing, messaging consent, and callback security can be verified for this business.</p></div></div>
        <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] ${hasActiveLine ? "bg-white text-rvx-recovered" : "bg-rvx-lilac-soft text-rvx-violet"}`}>{activationLabel}</span>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-rvx-border bg-white/75 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-rvx-slate">Assigned number</p><p className="mt-2 text-[16px] font-bold text-rvx-ink">{hasActiveLine ? formatPhone(business.twilio_phone_number) : "No Revorax number assigned yet"}</p><p className="mt-2 text-[11px] leading-5 text-rvx-slate">{hasActiveLine ? "Calls and texts to this number can now enter your Revorax workflow." : "Complete your business profile and workflow rules. An operator will assign or port the number, then this card will update."}</p></div>
        <ol className="grid gap-2 text-[11px] leading-5 text-rvx-slate"><li className="flex gap-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-rvx-ink text-[9px] font-bold text-white">1</span><span>Keep your business phone, service area, hours, and handoff number current.</span></li><li className="flex gap-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-rvx-ink text-[9px] font-bold text-white">2</span><span>A Revorax operator verifies routing and the approved messaging setup for this tenant.</span></li><li className="flex gap-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-rvx-ink text-[9px] font-bold text-white">3</span><span>{hasActiveLine ? "Test a call to the assigned number and watch it appear in Call history." : "You will see the assigned number here when activation is complete."}</span></li></ol>
      </div>
      <p className="mt-4 flex items-start gap-2 rounded-xl border border-rvx-border bg-white/75 px-3 py-2.5 text-[11px] leading-5 text-rvx-slate"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rvx-violet" />Never paste carrier credentials, webhook signing keys, or other phone-provider secrets into this workspace. Contact your Revorax operator for activation or routing changes.</p>
    </section>
  );
}

function SettingsScreen({ business, onSave }: { business: Business; onSave: (input: Partial<BusinessInput>) => Promise<void> }) {
  return <div className="grid gap-5"><SettingsView business={business} onSave={onSave} /><PhoneActivationStatus business={business} /><WorkflowRulesSettings business={business} onSave={onSave} /></div>;
}

export default function OperationsDashboard({ initialView = "inbox" }: { initialView?: DashboardView }) {
  const router = useRouter();
  const accessTokenRef = useRef<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [view, setView] = useState<DashboardView>(initialView);
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [smsMessages, setSmsMessages] = useState<SMSMessage[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const leadRequestIdRef = useRef(0);
  const [leadFilter, setLeadFilter] = useState<LeadFilter>("all");
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleAuthenticationError = useCallback((cause: unknown) => {
    if (cause instanceof ApiError && cause.status === 401) {
      clearStoredTokens();
      router.replace("/login?reason=session");
      return true;
    }
    return false;
  }, [router]);

  const loadWorkspace = useCallback(async (isRefresh = false) => {
    const tokens = getStoredTokens();
    if (!tokens) {
      router.replace("/login?next=/dashboard");
      return;
    }
    accessTokenRef.current = tokens.access_token;
    if (isRefresh) setRefreshing(true);
    else setLoadState("loading");
    setError(null);
    try {
      const currentUser = await getCurrentUser(tokens.access_token);
      setUser(currentUser);

      let currentBusiness: Business | null = null;
      try {
        currentBusiness = await getBusiness(tokens.access_token);
      } catch (cause) {
        if (!(cause instanceof ApiError && cause.status === 404)) throw cause;
      }
      setBusiness(currentBusiness);
      if (!currentBusiness) {
        setLoadState("onboarding");
        return;
      }

      const [nextStats, nextLeads, nextCalls, nextAppointments, nextRevenueAnalytics] = await Promise.all([
        getStats(tokens.access_token),
        getLeads(tokens.access_token),
        getCalls(tokens.access_token),
        getAppointments(tokens.access_token),
        getRevenueAnalytics(tokens.access_token),
      ]);
      setStats(nextStats);
      setLeads(nextLeads);
      setCalls(nextCalls);
      setAppointments(nextAppointments);
      setRevenueAnalytics(nextRevenueAnalytics);
      setLoadState("ready");
    } catch (cause) {
      if (!handleAuthenticationError(cause)) {
        setError(cause instanceof Error ? cause.message : "We could not load your operations desk.");
        setLoadState("error");
      }
    } finally {
      setRefreshing(false);
    }
  }, [handleAuthenticationError, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWorkspace();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadWorkspace]);

  const selectLead = useCallback(async (leadId: string) => {
    const accessToken = accessTokenRef.current;
    if (!accessToken) return;
    const requestId = ++leadRequestIdRef.current;
    setSelectedLeadId(leadId);
    setDetailLoading(true);
    setError(null);
    try {
      const [lead, messages] = await Promise.all([getLead(accessToken, leadId), getSmsThread(accessToken, leadId)]);
      if (requestId !== leadRequestIdRef.current) return;
      setSelectedLead(lead);
      setSmsMessages(messages);
    } catch (cause) {
      if (requestId === leadRequestIdRef.current && !handleAuthenticationError(cause)) setError(cause instanceof Error ? cause.message : "We could not load that lead.");
    } finally {
      if (requestId === leadRequestIdRef.current) setDetailLoading(false);
    }
  }, [handleAuthenticationError]);

  const createWorkspace = useCallback(async (input: BusinessInput) => {
    const accessToken = accessTokenRef.current;
    if (!accessToken) throw new Error("Your session has expired. Please sign in again.");
    try {
      const nextBusiness = await createBusiness(accessToken, input);
      setBusiness(nextBusiness);
      setNotice("Your business workspace is ready.");
      await loadWorkspace(true);
    } catch (cause) {
      if (handleAuthenticationError(cause)) throw new Error("Your session has expired. Please sign in again.");
      throw cause;
    }
  }, [handleAuthenticationError, loadWorkspace]);

  const saveBusiness = useCallback(async (input: Partial<BusinessInput>) => {
    const accessToken = accessTokenRef.current;
    if (!accessToken) throw new Error("Your session has expired. Please sign in again.");
    try {
      const updated = await updateBusiness(accessToken, input);
      setBusiness(updated);
      setNotice("Business settings saved.");
    } catch (cause) {
      if (handleAuthenticationError(cause)) throw new Error("Your session has expired. Please sign in again.");
      throw cause;
    }
  }, [handleAuthenticationError]);

  const changeLeadStatus = useCallback(async (status: LeadStatus) => {
    if (!selectedLead) return;
    const accessToken = accessTokenRef.current;
    if (!accessToken) return;
    try {
      const updated = await updateLeadStatus(accessToken, selectedLead.id, status);
      setSelectedLead(updated);
      setLeads((current) => current.map((lead) => lead.id === updated.id ? updated : lead));
      setStats(await getStats(accessToken));
      setNotice(`${updated.caller_name || "Lead"} marked ${titleCase(status).toLowerCase()}.`);
    } catch (cause) {
      if (!handleAuthenticationError(cause)) setError(cause instanceof Error ? cause.message : "We could not update this lead.");
    }
  }, [handleAuthenticationError, selectedLead]);

  const queueCustomerSms = useCallback(async (body: string): Promise<void> => {
    if (!selectedLead) throw new Error("Choose a lead first.");
    const accessToken = accessTokenRef.current;
    if (!accessToken) throw new Error("Your session has expired. Please sign in again.");
    try {
      await sendLeadSms(accessToken, selectedLead.id, body);
      setNotice("Text queued. Delivery will appear in the conversation after the messaging provider confirms it.");
    } catch (cause) {
      if (handleAuthenticationError(cause)) throw new Error("Your session has expired. Please sign in again.");
      throw cause;
    }
  }, [handleAuthenticationError, selectedLead]);

  const queueCustomerCallback = useCallback(async (
    input: { scheduled_for?: string; notes?: string },
  ): Promise<void> => {
    if (!selectedLead) throw new Error("Choose a lead first.");
    const accessToken = accessTokenRef.current;
    if (!accessToken) throw new Error("Your session has expired. Please sign in again.");
    try {
      const updated = await scheduleLeadCallback(accessToken, selectedLead.id, input);
      setSelectedLead(updated);
      setLeads((current) => current.map((lead) => lead.id === updated.id ? updated : lead));
      setStats(await getStats(accessToken));
      setNotice(input.scheduled_for ? "Callback scheduled and sent to the owner queue." : "Callback task sent to the owner queue now.");
    } catch (cause) {
      if (handleAuthenticationError(cause)) throw new Error("Your session has expired. Please sign in again.");
      throw cause;
    }
  }, [handleAuthenticationError, selectedLead]);

  const bookAppointment = useCallback(async (input: { scheduled_date: string; scheduled_time: string; service_type: string; notes: string }) => {
    if (!selectedLead) throw new Error("Choose a lead first.");
    const accessToken = accessTokenRef.current;
    if (!accessToken) throw new Error("Your session has expired. Please sign in again.");
    try {
      const appointment = await createAppointment(accessToken, { lead_id: selectedLead.id, ...input });
      setAppointments((current) => [appointment, ...current]);
      const updatedLead = await getLead(accessToken, selectedLead.id);
      setSelectedLead(updatedLead);
      setLeads((current) => current.map((lead) => lead.id === updatedLead.id ? updatedLead : lead));
      setStats(await getStats(accessToken));
      setNotice("Appointment booked and the lead moved to Booked.");
    } catch (cause) {
      if (handleAuthenticationError(cause)) throw new Error("Your session has expired. Please sign in again.");
      throw cause;
    }
  }, [handleAuthenticationError, selectedLead]);

  const changeAppointmentStatus = useCallback(async (appointmentId: string, status: Exclude<AppointmentStatus, "completed">) => {
    const accessToken = accessTokenRef.current;
    if (!accessToken) return;
    try {
      const updated = await updateAppointmentStatus(accessToken, appointmentId, status);
      setAppointments((current) => current.map((appointment) => appointment.id === updated.id ? updated : appointment));
      setStats(await getStats(accessToken));
      setNotice("Appointment status updated.");
    } catch (cause) {
      if (!handleAuthenticationError(cause)) setError(cause instanceof Error ? cause.message : "We could not update this appointment.");
    }
  }, [handleAuthenticationError]);

  const completeJob = useCallback(async (
    appointmentId: string,
    input: { actual_revenue: number; send_review_request: boolean },
  ): Promise<void> => {
    const accessToken = accessTokenRef.current;
    if (!accessToken) throw new Error("Your session has expired. Please sign in again.");
    try {
      const updated = await completeAppointment(accessToken, appointmentId, input);
      const [nextStats, nextRevenueAnalytics] = await Promise.all([
        getStats(accessToken),
        getRevenueAnalytics(accessToken),
      ]);
      setAppointments((current) => current.map((appointment) => appointment.id === updated.id ? updated : appointment));
      setStats(nextStats);
      setRevenueAnalytics(nextRevenueAnalytics);
      setNotice(input.send_review_request ? "Job completed, revenue recorded, and a consent-gated review request is scheduled." : "Job completed and revenue recorded.");
    } catch (cause) {
      if (handleAuthenticationError(cause)) throw new Error("Your session has expired. Please sign in again.");
      throw cause;
    }
  }, [handleAuthenticationError]);

  function signOut() {
    clearStoredTokens();
    router.replace("/login");
  }

  function changeView(nextView: DashboardView) {
    setView(nextView);
    if (nextView !== "settings") router.push("/dashboard");
    if (nextView === "settings") router.push("/dashboard/settings");
  }

  if (loadState === "loading") return <LoadingWorkspace />;
  if (loadState === "onboarding") return <Onboarding user={user} onComplete={createWorkspace} onSignOut={signOut} />;
  if (loadState === "error") return <main className="grid min-h-screen place-items-center bg-rvx-canvas p-5"><div className="max-w-md rounded-[24px] border border-rvx-border bg-white p-7 text-center shadow-[0_20px_50px_rgba(24,44,35,0.08)]"><span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-rvx-peach text-rvx-signal"><CircleAlert className="h-5 w-5" /></span><h1 className="mt-5 text-2xl font-bold tracking-[-0.05em] text-rvx-ink">We could not open your desk.</h1><p className="mt-3 text-[13px] leading-6 text-rvx-slate">{error || "Please check your connection and try again."}</p><button type="button" onClick={() => void loadWorkspace()} className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-rvx-ink px-4 text-[12px] font-bold text-white transition hover:bg-rvx-signal"><RefreshCw className="h-3.5 w-3.5" />Try again</button><button type="button" onClick={signOut} className="ml-3 text-[12px] font-bold text-rvx-slate transition hover:text-rvx-ink">Sign out</button></div></main>;
  if (!business || !stats) return <LoadingWorkspace />;

  const activeNavItem = navItems.find((item) => item.id === view) ?? navItems[0];

  return <div className="min-h-screen bg-rvx-canvas text-rvx-ink">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[238px] border-r border-rvx-border bg-white p-5 lg:flex lg:flex-col">
      <Link href="/" aria-label="Revorax home"><BrandMark /></Link>
      <div className="mt-10"><p className="px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-rvx-slate">Operations desk</p><nav className="mt-3 grid gap-1" aria-label="Dashboard navigation">{navItems.map((item) => { const Icon = item.icon; const active = view === item.id; return <button type="button" key={item.id} onClick={() => changeView(item.id)} className={`flex h-11 items-center gap-3 rounded-xl px-3 text-left text-[12px] font-bold transition ${active ? "bg-rvx-ink text-white shadow-[0_10px_20px_rgba(16,40,30,0.12)]" : "text-rvx-slate hover:bg-rvx-canvas hover:text-rvx-ink"}`}><Icon className="h-4 w-4" />{item.label}{active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-rvx-mint" />}</button>; })}</nav></div>
      <div className="mt-auto rounded-2xl bg-rvx-mint p-3.5"><p className="text-[9px] font-bold uppercase tracking-[0.11em] text-rvx-recovered">Your Revorax line</p><p className="mt-2 text-[12px] font-bold text-rvx-ink">{business.twilio_phone_number ? formatPhone(business.twilio_phone_number) : "Provisioning in progress"}</p><Link href="/dashboard/settings" onClick={() => setView("settings")} className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold text-rvx-ink transition hover:text-rvx-signal">Business settings <ArrowUpRight className="h-3 w-3" /></Link></div>
    </aside>

    <main className="min-h-screen lg:pl-[238px]">
      <header className="sticky top-0 z-20 border-b border-rvx-border bg-rvx-canvas/90 px-5 py-3 backdrop-blur-xl sm:px-7 lg:px-9"><div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><Link href="/" className="lg:hidden"><BrandMark /></Link><div className="hidden min-w-0 lg:block"><p className="truncate text-[12px] font-bold text-rvx-ink">{business.name}</p><p className="mt-0.5 text-[10px] text-rvx-slate">{activeNavItem.label}</p></div></div><div className="flex items-center gap-2"><button type="button" onClick={() => void loadWorkspace(true)} disabled={refreshing} className="grid h-9 w-9 place-items-center rounded-xl border border-rvx-border bg-white text-rvx-slate transition hover:border-rvx-ink hover:text-rvx-ink disabled:opacity-60" aria-label="Refresh dashboard">{refreshing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</button><div className="hidden items-center gap-2 border-l border-rvx-border pl-3 sm:flex"><span className="grid h-8 w-8 place-items-center rounded-full bg-rvx-lilac-soft text-[10px] font-bold text-rvx-violet">{initials(user?.full_name)}</span><div className="max-w-32"><p className="truncate text-[11px] font-bold text-rvx-ink">{user?.full_name || "Account"}</p><button type="button" onClick={signOut} className="text-[10px] font-semibold text-rvx-slate transition hover:text-rvx-signal">Sign out</button></div></div><button type="button" onClick={signOut} className="grid h-9 w-9 place-items-center rounded-xl border border-rvx-border bg-white text-rvx-slate transition hover:border-rvx-signal hover:text-rvx-signal sm:hidden" aria-label="Sign out"><LogOut className="h-4 w-4" /></button></div></div></header>

      <div className="border-b border-rvx-border bg-white px-5 py-2.5 lg:hidden"><div className="mx-auto flex max-w-[1440px] gap-2 overflow-x-auto" role="tablist" aria-label="Dashboard navigation">{navItems.map((item) => { const Icon = item.icon; const active = view === item.id; return <button key={item.id} type="button" onClick={() => changeView(item.id)} role="tab" aria-selected={active} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-bold transition ${active ? "bg-rvx-ink text-white" : "text-rvx-slate hover:bg-rvx-canvas"}`}><Icon className="h-3.5 w-3.5" />{item.label}</button>; })}</div></div>

      <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-7 lg:px-9 lg:py-8">
        {notice && <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-rvx-recovered/20 bg-rvx-mint px-4 py-3 text-[12px] font-semibold text-rvx-recovered"><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{notice}</span><button type="button" onClick={() => setNotice(null)} className="text-rvx-recovered/70 transition hover:text-rvx-recovered" aria-label="Dismiss message"><X className="h-4 w-4" /></button></div>}
        {error && <div className="mb-5"><InlineError>{error}</InlineError></div>}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-rvx-slate"><span className="h-1.5 w-1.5 rounded-full bg-rvx-recovered" /> Live operations</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.055em] text-rvx-ink sm:text-[2.15rem]">{view === "inbox" ? "Every caller, ready for a next step." : view === "calls" ? "Call activity, with context." : view === "appointments" ? "From conversation to scheduled work." : "Make every first response feel like your business."}</h1><p className="mt-2 max-w-2xl text-[13px] leading-6 text-rvx-slate">{view === "inbox" ? "Review intent, prioritize urgency, and move qualified customers toward a booked appointment." : view === "calls" ? "See every outcome and open the lead behind a caller when you need more context." : view === "appointments" ? "Keep your scheduled work visible from confirmation through completion." : "Keep the information Revorax uses for your lead workflow current and customer-ready."}</p></div>{view === "inbox" && <button type="button" onClick={() => setView("appointments")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-rvx-border bg-white px-3.5 text-[11px] font-bold text-rvx-ink transition hover:border-rvx-ink hover:bg-rvx-ink hover:text-white"><CalendarDays className="h-3.5 w-3.5" />View appointments</button>}</div>

        {view === "inbox" && <><section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="New leads today" value={stats.leads_today} detail={`${stats.leads_this_week} captured this week`} icon={Inbox} /><MetricCard label="Calls today" value={stats.calls_today} detail="All phone activity captured" icon={PhoneCall} /><MetricCard label="Missed calls" value={stats.missed_calls_today} detail="Review recovery and follow-up" tone="alert" icon={BellRing} /><MetricCard label="Upcoming work" value={stats.appointments_upcoming} detail="Confirmed or reminded appointments" tone="mint" icon={CalendarDays} /></section><section className="grid gap-5 xl:grid-cols-[minmax(370px,0.76fr)_minmax(470px,1.24fr)]"><LeadInbox leads={leads} activeLeadId={selectedLeadId} leadFilter={leadFilter} onFilterChange={setLeadFilter} onSelectLead={(leadId) => { void selectLead(leadId); }} /><LeadDetail key={selectedLead?.id ?? "empty"} lead={selectedLead} smsMessages={smsMessages} loading={detailLoading} onUpdateStatus={(status) => { void changeLeadStatus(status); }} onCreateAppointment={bookAppointment} onSendSms={queueCustomerSms} onScheduleCallback={queueCustomerCallback} /></section></>}
        {view === "calls" && <CallsView calls={calls} leads={leads} onSelectLead={(leadId) => { setView("inbox"); router.push("/dashboard"); void selectLead(leadId); }} />}
        {view === "appointments" && <AppointmentsView appointments={appointments} leads={leads} revenueAnalytics={revenueAnalytics} reviewRequestsEnabled={business.review_request_enabled} onUpdate={(id, status) => { void changeAppointmentStatus(id, status); }} onComplete={completeJob} />}
        {view === "settings" && <SettingsScreen business={business} onSave={saveBusiness} />}
      </div>
    </main>
  </div>;
}
