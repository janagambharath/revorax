# Revorax single-service Railway deployment

This repository now deploys the Next.js frontend and FastAPI backend together
as one Railway service. Railway exposes Next.js on its assigned `PORT`; Next.js
proxies `/api/v1/*` and `/health` to FastAPI over `127.0.0.1:8000`.

## Deploy

1. In Railway, create one service from this GitHub repository and deploy the
   `main` branch.
2. Leave the service **Root Directory** blank (the repository root).
3. Leave the config path at the root `railway.toml` and redeploy. Railway will
   use the root `Dockerfile` automatically.
4. Generate a public Railway domain, then set both variables below to that
   exact HTTPS URL, with no trailing slash. Railway can keep them in sync with
   its domain by using its template variable:

   ```text
   FRONTEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
   BACKEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
   ```

5. Verify `https://your-service.up.railway.app/health` returns a healthy JSON
   response and load the homepage from the same domain.

## Required Railway variables

```text
APP_ENV=production
DEBUG=false
FRONTEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
BACKEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET_KEY=<generate a long random secret>
TWILIO_ACCOUNT_SID=<Twilio account SID>
TWILIO_AUTH_TOKEN=<Twilio auth token>
OPENROUTER_API_KEY=<OpenRouter key>
GROQ_API_KEY=<Groq key>
RESEND_API_KEY=<Resend key>
FROM_EMAIL=Revorax <verified-sender@your-domain.com>
NOTIFY_EMAIL=<demo-request notification email>
CORS_ORIGINS=["https://${{RAILWAY_PUBLIC_DOMAIN}}"]
ENABLE_SELF_SERVICE_PROVISIONING=false
ENABLE_SELF_SERVICE_SIGNUP=false
PILOT_SIGNUP_CODES=["replace-with-a-long-random-pilot-code"]
ENABLE_SMS_AUTOMATION=false
ADMIN_PROVISIONING_TOKEN=<long-random-operator-only-secret>
CRM_WEBHOOK_SIGNING_SECRET=<long-random-secret-if-using-a-CRM-webhook>
CRM_WEBHOOK_ALLOWED_HOSTS=["hooks.zapier.com"]
```

Add a Railway Postgres service before enabling the workflow; the single app
service runs its durable automation worker against that database. Redis is not
required by the current database-backed worker. `FROM_EMAIL` must be a
Resend-verified sender whenever `RESEND_API_KEY` is configured. Set
`SENTRY_DSN` and Stripe variables only when those integrations are configured.
Leave `SENTRY_DSN` unset unless it is a valid Sentry DSN; do not use a
placeholder value.

Do not enable self-service number provisioning until its billing/approval path
is in place. Do not set `ENABLE_SMS_AUTOMATION=true` until the sending number
has the appropriate carrier registration, consent language, STOP/HELP handling,
and an end-to-end test. Owner-authored dashboard SMS still honors the durable
STOP suppression ledger.

Revorax is intentionally invite-only by default. Give each approved pilot a
long code through a secure channel and add it to `PILOT_SIGNUP_CODES`; do not
turn on `ENABLE_SELF_SERVICE_SIGNUP` until verified email, billing, and support
operations are live.

With self-service provisioning disabled, activate a verified Twilio number per
tenant through `POST /api/v1/business/internal/attach-twilio-number` using the
`X-Revorax-Admin-Token` header. The endpoint verifies that the number belongs
to the configured Twilio account, writes its callback URLs, and binds it to one
business; never expose this operator token in the frontend.

CRM delivery is disabled until `CRM_WEBHOOK_ALLOWED_HOSTS` lists the exact
public integration hostname(s). This prevents a tenant-entered URL from
reaching Railway or cloud-internal addresses. Revorax signs each approved
delivery with `X-Revorax-Signature` using `CRM_WEBHOOK_SIGNING_SECRET`.

## Twilio callbacks

Set the Twilio webhook URLs to the same Railway domain:

```text
https://your-service.up.railway.app/api/v1/webhooks/twilio/voice
https://your-service.up.railway.app/api/v1/webhooks/twilio/sms
https://your-service.up.railway.app/api/v1/webhooks/twilio/status
```

The public `BACKEND_URL` must remain the same domain because it is used to
generate and validate Twilio callback URLs.

## Before accepting real traffic

- The application runs `alembic upgrade head` before starting FastAPI. Confirm
  the deployment logs show the initial migration completing successfully.
- For an existing database, take a backup and resolve duplicates before this
  release adds its uniqueness protections:

  ```sql
  SELECT business_id, scheduled_date, scheduled_time, COUNT(*)
  FROM appointments
  WHERE status NOT IN ('cancelled', 'no_show')
  GROUP BY business_id, scheduled_date, scheduled_time
  HAVING COUNT(*) > 1;

  SELECT twilio_message_sid, COUNT(*)
  FROM sms_messages
  WHERE twilio_message_sid IS NOT NULL
  GROUP BY twilio_message_sid
  HAVING COUNT(*) > 1;
  ```

  The migration stops rather than silently choosing which appointment or SMS
  record to discard.
- Submit the homepage demo form and confirm notification delivery.
- Create a test business and Twilio number, then verify the missed-call and
  inbound-SMS paths end to end.

## Closed-pilot acceptance test

Run these from a real mobile phone after number attachment. Use a test number
until your carrier registration and consent language are approved. Record the
result in the pilot account—not just the Railway log.

| Scenario | Expected result |
|---|---|
| Call and ask a FAQ | The caller gets only the configured answer or a human/callback fallback; no invented availability or pricing. |
| Call with name, service address, service, and urgency | A tenant-scoped lead receives the facts and a clear owner action; out-of-hours/out-of-area requests are not promised a booking. |
| Miss the call / leave voicemail | A call and lead are persisted once, voicemail work is queued, and the owner is notified. |
| Send `STOP`, then `START`, then a normal text | STOP suppresses all outbound text; only explicit START restores permission; the message is never processed twice on provider retry. |
| Book, cancel/no-show, then complete a job | The active slot cannot double-book; cancellation/no-show makes a human recovery task; completion records actual revenue and schedules a review only for an eligible, opted-in contact. |

Do not enable `ENABLE_SMS_AUTOMATION=true` until the above passes with the
actual number, consent records, Twilio/A2P approval, and a named owner who can
respond to the alerts. A deployment that merely returns `/health` is not an
accepted customer workflow.
