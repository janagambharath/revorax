"use client";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { CalendarCheck, Clock, UserCheck, TrendingUp } from "lucide-react";

const metrics = [
  { icon: CalendarCheck, label: "Appointments Today", value: "24", color: "text-blue" },
  { icon: Clock, label: "Follow-Ups Due", value: "18", color: "text-amber-500" },
  { icon: UserCheck, label: "Booked This Week", value: "31", color: "text-emerald-600" },
  { icon: TrendingUp, label: "Open Opportunities", value: "12", color: "text-blue-light" },
];

const pipeline = [
  { patient: "Ananya S.", purpose: "Follow-up cleaning", status: "Scheduled", statusColor: "bg-emerald-50 text-emerald-700", action: "Confirm" },
  { patient: "Vikram R.", purpose: "Root canal session 2", status: "Contacted", statusColor: "bg-blue-pale text-blue", action: "Await response" },
  { patient: "Priya M.", purpose: "Orthodontic check", status: "Due", statusColor: "bg-amber-50 text-amber-700", action: "Follow up" },
  { patient: "Arjun K.", purpose: "Post-treatment review", status: "Rescheduled", statusColor: "bg-surface-alt text-charcoal", action: "Confirm new time" },
  { patient: "Meera D.", purpose: "Initial consultation", status: "New request", statusColor: "bg-blue-pale text-blue", action: "Schedule" },
];

export default function DashboardPreview() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 lg:py-28">
      <div ref={ref} className="max-w-[1200px] mx-auto px-6">
        {/* Dashboard UI */}
        <div
          className={cn(
            "bg-white rounded-2xl border border-border shadow-[0_12px_48px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {/* Top Bar */}
          <div className="flex items-center gap-2 px-6 py-3.5 bg-navy">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
            </div>
            <div className="flex-1 flex justify-center">
              <span className="text-[12px] font-medium text-white/50">
                REvorax Dashboard
              </span>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {metrics.map((metric, i) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className={cn(
                      "bg-surface-alt rounded-xl p-4 transition-all duration-500",
                      isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    )}
                    style={{ transitionDelay: isInView ? `${200 + i * 80}ms` : "0ms" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={14} className={metric.color} />
                      <span className="text-[11px] font-medium text-slate">{metric.label}</span>
                    </div>
                    <div className="text-[28px] font-[700] text-navy tracking-[-0.02em]">
                      {metric.value}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pipeline Table */}
            <div
              className={cn(
                "transition-all duration-700",
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: isInView ? "500ms" : "0ms" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-semibold text-navy">Patient Pipeline</h3>
                <span className="text-[12px] text-slate">Today</span>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-[11px] font-semibold text-slate uppercase tracking-wider pb-3 pr-4">Patient</th>
                      <th className="text-[11px] font-semibold text-slate uppercase tracking-wider pb-3 pr-4">Purpose</th>
                      <th className="text-[11px] font-semibold text-slate uppercase tracking-wider pb-3 pr-4">Status</th>
                      <th className="text-[11px] font-semibold text-slate uppercase tracking-wider pb-3">Next Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipeline.map((row, i) => (
                      <tr
                        key={row.patient}
                        className={cn(
                          "border-b border-border-light transition-all duration-500",
                          isInView ? "opacity-100" : "opacity-0"
                        )}
                        style={{ transitionDelay: isInView ? `${600 + i * 60}ms` : "0ms" }}
                      >
                        <td className="py-3 pr-4">
                          <span className="text-[13px] font-medium text-navy">{row.patient}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-[13px] text-charcoal">{row.purpose}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={cn("inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full", row.statusColor)}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="text-[13px] text-blue font-medium">{row.action}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {pipeline.map((row, i) => (
                  <div
                    key={row.patient}
                    className={cn(
                      "bg-surface-alt rounded-xl p-4 transition-all duration-500",
                      isInView ? "opacity-100" : "opacity-0"
                    )}
                    style={{ transitionDelay: isInView ? `${600 + i * 60}ms` : "0ms" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-medium text-navy">{row.patient}</span>
                      <span className={cn("inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full", row.statusColor)}>
                        {row.status}
                      </span>
                    </div>
                    <div className="text-[12px] text-charcoal mb-1">{row.purpose}</div>
                    <div className="text-[12px] text-blue font-medium">{row.action}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
