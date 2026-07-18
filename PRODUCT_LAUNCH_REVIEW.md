# Revorax: Ruthless Product Reset and Launch Decision

**Date:** 2026-07-18  
**Decision:** **Go for an invite-only, one-location HVAC pilot. No-go for public self-serve.**

This is the current source of truth for product scope. `LAUNCH_READINESS_BLUEPRINT.md` remains the broader operating backlog; this document makes the launch decision and the product boundary explicit.

## A. Executive summary

Revorax is viable only when it is sold as **missed-call recovery for HVAC**, not as a replacement field-service platform, an always-perfect voice agent, or a generic AI dashboard. The sellable job is simple: when an HVAC office misses a call, capture the intent, recover the conversation safely, put one accountable human next step in front of the owner, and prove whether that opportunity became revenue.

This release adds the minimum credible vertical slice: invite-only access, operator-controlled phone activation, live call qualification with a transfer/callback fallback, consent-gated messaging, durable jobs, tenant-safe lead/appointment handling, cancellation and no-show recovery, callback tasks, revenue completion, review scheduling, and a focused operations desk. It intentionally does **not** pretend to be ServiceTitan, Jobber, or a human answering network.

## B. Brutal verdict

The previous product was trying to be a landing page, a voice AI, a CRM, a scheduler, a messaging platform, and an analytics product at once. That is not a launchable thesis. It had serious operational gaps: public account creation, synchronous webhook work, duplicate-delivery failure modes, unbounded number provisioning, unsafe CRM URLs, unclear consent, no real operator action path, and weak pricing.

The corrected product is salvageable because the pain is real and immediate: a missed emergency or replacement call can become a lost job. The company should launch **one closed, white-glove pilot offer** today—not a public SaaS rollout. Public self-serve remains irresponsible until identity, billing, support, telecom compliance, and real outcome evidence exist.

## C. Top strengths

1. The buyer pain is concrete: missed high-intent HVAC calls are a revenue leak, not a nice-to-have workflow.
2. The product now has a narrow human-controlled path from intake to scheduled or completed work.
3. Business rules are explicit: hours, service ZIPs, offered services, transfer number, notice period, and slot duration constrain automation.
4. The dashboard leads with action and context rather than vanity charts.
5. The stack is small enough to run as one Railway service with FastAPI, Next.js, Postgres, and a durable database outbox worker.

## D. Top weaknesses

1. There is no technician-aware calendar integration, capacity model, or route optimization. Revorax cannot honestly promise universal autonomous booking.
2. There is no billing/entitlement system, verified-email flow, password reset, team roles, audit log, or support console.
3. Browser tokens are still stored in local storage; that is acceptable only for a tightly controlled pilot, not mature multi-tenant SaaS.
4. The value proposition has no customer proof yet. Until Revorax measures recovered jobs, all ROI language is hypothesis.
5. Twilio/A2P registration, consent language, carrier deliverability, and real call quality must be verified on the actual production number—not inferred from code.

## E. Critical flaws

| Problem | Why it matters | Sales / retention impact | What changed | Priority | Effort | Expected ROI |
|---|---|---|---|---|---|---|
| Twilio retries could duplicate calls, texts, or automation | Duplicate messages destroy caller trust | Churn and carrier-risk exposure | Savepoint/re-read idempotency for inbound calls, SMS, consent records, and outbox jobs | P0 | Done | High |
| Expensive work ran in webhooks | A slow AI/provider call can make Twilio retry or abandon the interaction | Lost leads under load | Recording/SMS/CRM/follow-up work moves to a durable Postgres worker | P0 | Done | High |
| Customers could self-provision billable numbers | Fraud, billing leakage, and support chaos | Margin loss and security risk | Operator-only number attachment; self-service provisioning off | P0 | Done | High |
| Any user could create an account | Public accounts without verification/support are an abuse surface | Support and security cost | Invite-only pilot gate with operator-managed codes | P0 | Done | High |
| SMS could imply delivery without consent | Legal and customer-trust risk | Carrier suspension / churn | STOP/START/HELP ledger, consent gates, and manual SMS refusal when consent is absent | P0 | Done | High |
| Appointment creation could cross tenants or double-book | Security breach and operational error | Immediate deal-breaker | Tenant lead lookup plus active-slot database uniqueness | P0 | Done | High |
| Cancellation/no-show was a dead end | Recoverable jobs disappeared | Revenue leakage | Owner callback alert, consent-gated reschedule text, CRM event, and closed-terminal state rules | P1 | Done | Medium |
| Demo form logged PII and could claim success after failed delivery | A prospect can be silently lost | Conversion damage | Validated, escaped, rate-limited Resend delivery that returns an honest failure | P0 | Done | Medium |
| Calendar/dispatch source of truth is missing | AI can book the wrong technician/time | Broken promise | Do not sell autonomous scheduling outside the conservative single-capacity pilot | P0 | Remaining | Very high |
| Billing, authentication hardening, and customer support are missing | No repeatable public SaaS motion | Revenue leakage / churn | Keep the launch invite-only | P0 | Remaining | High |

## F. Missing flows

- **Calendar sync:** Do not build a competing calendar first. Choose one source of truth per pilot (manual Revorax slots or the customer’s existing scheduler) and add one integration after five proven pilots.
- **Human fallback:** Transfer to the configured business number works; a staffed human answering network does not exist. Never imply it does.
- **Lost-lead analysis:** Owners can mark a lead lost, but reason capture and win/loss reporting should be the next analytics increment.
- **Reschedule confirmation:** Cancellation/no-show triggers recovery, but a human confirms the new slot. That is the correct pilot behavior.
- **Outbound lifecycle:** Review requests are deliberately limited to explicitly opted-in customers. Do not broaden marketing automation before compliance and outcome proof.

## G. Missing features to add only after pilot proof

1. One native calendar/FSM integration chosen from actual pilot usage.
2. Team roles, owner/dispatcher permissions, audit history, and support tooling.
3. Verified email, password reset, HTTP-only session strategy, and security review.
4. Provider dashboards: message delivery, failed jobs, transfer outcome, and number health.
5. Lost reason, reschedule reason, technician/job linkage, and attribution from recovered lead to closed revenue.
6. Billing and hard usage limits—not a speculative pricing page with three unproven tiers.

## H. Bad features to remove or keep off

- Public sign-up without approved invitation.
- Self-serve Twilio number purchase/porting.
- “AI receptionist” claims that suggest every call is autonomously solved.
- Multi-location, technician routing, inventory, invoicing, payments, or full CRM ambitions before integration evidence.
- Generic marketing sequences and reviews without explicit messaging consent.
- Any revenue-lift statistic not calculated from a customer’s actual completed jobs.

## I. Product simplification plan

**One product, one job, one proof event:**

`Missed HVAC call → qualified context → owner action → booked/completed job → recovered revenue evidence.`

Everything must serve that chain. The dashboard should be a **Lead Desk**, not a BI warehouse. The onboarding should configure the exact rules that prevent a bad promise. The sales motion should start with a missed-call audit, not a feature tour.

## J. Rewritten product positioning

**Revorax is the missed-call recovery desk for HVAC offices. It gives every missed caller a fast, consent-safe next step and gives the office the context and accountability to recover the job.**

## K. Rewritten one-line value proposition

**Recover missed HVAC calls before they become someone else’s job.**

## L. Rewritten homepage message

**Headline:** Every missed HVAC call can still become a clear next step.  
**Subheadline:** Revorax turns a missed call into qualified context, a consent-safe recovery path, and an accountable human follow-up—without replacing your dispatcher or your existing field-service system.  
**Primary CTA:** Request a pilot review.  
**Proof CTA:** See how one missed call becomes an owner action.

## M. Rewritten core user flow

```text
Caller reaches Revorax number
        ↓
Live assistant collects only name, service address, service, urgency, and intent
        ↓
Rules check: hours + ZIP + supported service + conservative availability
        ↓
Transfer, callback, FAQ, conservative booking, or voicemail recovery
        ↓
Postgres outbox records the fact before any AI/SMS/CRM work
        ↓
Owner gets a clear task with caller context
        ↓
Owner calls, texts only with consent, or books manually
        ↓
Completed job records actual revenue; consented review request may follow
```

## N. Rewritten onboarding flow

1. Founder approves the HVAC office and sends one unique invitation code.
2. Owner creates the workspace and completes business profile, services, hours, ZIP coverage, transfer number, and timezone.
3. Owner chooses whether conservative single-capacity auto-booking is on. Default: off.
4. Operator attaches or ports one verified Twilio number and validates Twilio callbacks.
5. Run five controlled test scenarios: answered call, missed call, voicemail, STOP/START, and no-show/cancellation.
6. Review the first ten real interactions with the owner before enabling any SMS automation.
7. At 30 days, calculate recovered opportunities, booked jobs, completed revenue, and failure reasons. Renew only if the result is credible.

## O. Rewritten dashboard structure

1. **Lead inbox (default):** urgency, service, caller, last activity, one next action.
2. **Lead detail:** recording/transcript, qualification, consent state, call/text/callback/booking actions.
3. **Appointments:** confirmed, reminder status, cancelled/no-show recovery, completed revenue.
4. **Calls:** call state, transcript, action taken, linked lead.
5. **Business rules:** services, hours, ZIPs, transfer, booking policy, consent-aware review control, approved CRM endpoint.
6. **Later:** delivery failures, audit log, team queue, billing, integration health.

## P. Rewritten pricing recommendation

Launch one offer, not a menu:

| Offer | Price | Includes | Guardrail |
|---|---:|---|---|
| Founding HVAC pilot | **$149/location/month for 90 days** | One number, up to 100 eligible recovery workflows/month, white-glove setup, lead desk, outcome review | Invite-only; no promised autonomous calendar integration |
| Proven core plan (after pilot evidence) | **$349/location/month** | 250 eligible recovery workflows/month, measured revenue report, selected integration | Add only after 5 pilots and measured unit margin |

Do not charge per AI token or create enterprise packaging now. A customer should be able to justify the pilot with one recovered service or replacement job; validate that premise in the first 30 days rather than claiming it.

## Q. Rewritten technical architecture

```text
Next.js web app (marketing + operations desk)
        │ same Railway domain / API rewrite
FastAPI API ── Postgres (tenant data, consent ledger, appointments, outbox)
        │                                      │
        │                                      └── Durable worker
        │                                               ├── Twilio SMS/call callbacks
        │                                               ├── AI transcription/qualification
        │                                               ├── owner notifications
        │                                               └── signed, allowlisted CRM events
        └── Twilio signature validation + tenant number lookup
```

Rules:

- The webhook records an immutable fact quickly; the worker performs slow/external work.
- Database uniqueness and idempotency keys are the last line of defense against provider retries.
- SMS is permitted only through the tenant-scoped consent ledger.
- CRM delivery accepts only exact, operator-allowlisted HTTPS hosts and signs every payload.
- Revorax owns intake/recovery; the customer’s field-service system remains the operational source of truth until a validated integration exists.

## R. Rewritten launch plan

### Today: technical pilot launch

1. Deploy the pushed `main` branch as one Railway service with Railway Postgres.
2. Set production variables from `DEPLOY_CHECKLIST.md`, including a real `JWT_SECRET_KEY`, `PILOT_SIGNUP_CODES`, Twilio keys, and verified Resend sender.
3. Keep `ENABLE_SELF_SERVICE_SIGNUP=false`, `ENABLE_SELF_SERVICE_PROVISIONING=false`, and `ENABLE_SMS_AUTOMATION=false` until each is explicitly approved.
4. Attach one verified Twilio number with the operator endpoint; never expose the operator token to a browser.
5. Run the five controlled call/SMS scenarios on the live number and inspect the dashboard and worker logs.

### Next 7 days: prove the wedge

1. Onboard one real HVAC office with a signed pilot agreement and a named owner.
2. Do daily failure review: missed-call recovery latency, qualification accuracy, transfer outcome, SMS delivery, manual follow-up completion.
3. Require the owner to record booked and completed revenue. Do not fabricate ROI.
4. Interview the dispatcher after ten interactions; remove every dashboard field they do not use.

### Before public launch

Email verification, secure session handling, password reset, billing, roles/audit logs, Twilio/A2P and legal approval, a staging environment with provider tests, alerting/on-call, support workflows, and at least three pilots with verified revenue evidence.

## S. Priority fixes ranked by impact

| Rank | Fix | Status | Impact | Effort | Expected ROI |
|---:|---|---|---|---|---|
| 1 | Run one real number through five controlled scenarios and correct every failure | Required today | Proves or disproves the product | 2–4h | Highest |
| 2 | Sell only the invite-only $149 founding pilot | Ready | Removes positioning confusion and support risk | 1h | Highest |
| 3 | Get explicit carrier/legal approval before enabling automatic SMS | Required before SMS | Prevents business-ending compliance risk | External | Highest |
| 4 | Add one calendar/FSM integration only after pilots identify the source of truth | Next | Prevents bad bookings and increases retention | 2–4 weeks | High |
| 5 | Add verified email, HTTP-only sessions, reset, roles, and audit log | Before public launch | Makes multi-tenant access defensible | 1–2 weeks | High |
| 6 | Add billing/usage enforcement after unit-margin proof | Before scale | Protects margin | 1–2 weeks | High |
| 7 | Add win/loss reasons and actual recovery attribution | Next | Turns product into an ROI system | 3–5 days | Medium |

## T. Final product score

| Launch mode | Score | Decision |
|---|---:|---|
| Closed, founder-monitored HVAC pilot | **62/100** | Go after live-number acceptance testing |
| Paid pilot for a small invited cohort | **48/100** | Conditional; needs verified compliance and observed reliability |
| Public self-serve SaaS | **29/100** | No-go |

The score is deliberately not higher. Code can create a credible pilot, but it cannot substitute for carrier approval, a real phone number test, owner behavior, customer proof, security operations, or a correct source-of-truth calendar.

## Final answer

1. **Single most important fix:** Run a real HVAC number through the complete missed-call-to-owner-action flow today and measure whether a real owner can act without your help.
2. **Second most important fix:** Keep the product invite-only and sell one measured recovery pilot; do not open generic self-serve sign-up or claim an all-in-one AI receptionist.
3. **Exact next step today:** Set the Railway variables, attach one Twilio number, invite one HVAC owner, then call that number five times using the controlled scenarios in `DEPLOY_CHECKLIST.md` before accepting a single paid customer.

## Competitive reality

Revorax should not try to out-feature the incumbents. ServiceTitan and Jobber already position themselves around broader scheduling, dispatch, job management, invoicing, and operational systems; Podium combines phones, messaging, reviews, and payments; Smith.ai and Ruby offer human-backed answering; GoHighLevel supports conversational appointment booking; and CallRail owns attribution and conversation intelligence. See the current official pages for [ServiceTitan](https://www.servicetitan.com/features/dispatch-software), [Jobber](https://www.getjobber.com/features/field-service-management-software/), [Podium Phones](https://www.podium.com/product/phones), [Smith.ai](https://smith.ai/features/24-7-answering-service), [Ruby](https://www.ruby.com/answering-service/), [HighLevel](https://help.gohighlevel.com/support/solutions/articles/155000000210-appointment-booking-in-conversation-ai), and [CallRail](https://www.callrail.com/).

**Revorax wins only by being the easiest, most accountable recovery layer for a small HVAC office that does not want to replace its system of record.** Its defensibility comes from a measured recovery dataset and workflow fit, not from a generic LLM or a prettier dashboard.
