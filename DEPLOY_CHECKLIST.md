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
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET_KEY=<generate a long random secret>
TWILIO_ACCOUNT_SID=<Twilio account SID>
TWILIO_AUTH_TOKEN=<Twilio auth token>
OPENROUTER_API_KEY=<OpenRouter key>
GROQ_API_KEY=<Groq key>
RESEND_API_KEY=<Resend key>
FROM_EMAIL=Revorax <verified-sender@your-domain.com>
NOTIFY_EMAIL=<demo-request notification email>
CORS_ORIGINS=["https://${{RAILWAY_PUBLIC_DOMAIN}}"]
```

Add Railway Postgres and Redis services before enabling the workflow that
processes leads. `FROM_EMAIL` must be a Resend-verified sender whenever
`RESEND_API_KEY` is configured. Set `SENTRY_DSN` and Stripe variables only when
those integrations are configured.

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
- Submit the homepage demo form and confirm notification delivery.
- Create a test business and Twilio number, then verify the missed-call and
  inbound-SMS paths end to end.
