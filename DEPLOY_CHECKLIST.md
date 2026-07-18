# Revorax — Production Environment Checklist

## Before you deploy, make sure every item below is set up.

### 1. Domain (revorax.com)
- [ ] Domain registered (Namecheap, Cloudflare, etc.)
- [ ] DNS pointed to Vercel (CNAME or A record)
- [ ] SSL auto-provisioned by Vercel

### 2. Vercel (Frontend)
- [ ] Connect GitHub repo → frontend folder
- [ ] Set root directory to `frontend`
- [ ] Set environment variables:
  - `RESEND_API_KEY` — from https://resend.com/api-keys
  - `NOTIFY_EMAIL` — your personal email for demo requests

### 3. Railway (Backend)
- [ ] Create new project on Railway
- [ ] Add PostgreSQL service (Railway built-in)
- [ ] Add Redis service (Railway built-in)
- [ ] Connect GitHub repo → backend folder
- [ ] Set environment variables:
  - `APP_ENV=production`
  - `DEBUG=false`
  - `FRONTEND_URL=https://revorax.com`
  - `BACKEND_URL=https://your-railway-app.railway.app`
  - `DATABASE_URL` — auto-set by Railway PostgreSQL
  - `REDIS_URL` — auto-set by Railway Redis
  - `JWT_SECRET_KEY` — generate: `python -c "import secrets; print(secrets.token_hex(32))"`
  - `TWILIO_ACCOUNT_SID` — from Twilio console
  - `TWILIO_AUTH_TOKEN` — from Twilio console
  - `OPENROUTER_API_KEY` — from https://openrouter.ai/keys
  - `OPENROUTER_MODEL=deepseek/deepseek-chat-v3-0324:free`
  - `GROQ_API_KEY` — from https://console.groq.com/keys
  - `RESEND_API_KEY` — from https://resend.com/api-keys
  - `SENTRY_DSN` — from https://sentry.io (create a FastAPI project)

### 4. Twilio
- [ ] Create account at https://twilio.com
- [ ] Add $20 balance (minimum to buy a number)
- [ ] Verify your personal phone number
- [ ] Register for A2P 10DLC (required for business SMS in US)
  - Brand registration (~$4 one-time)
  - Campaign registration (~$15/month)
  - This is required or Twilio will block your SMS

### 5. Resend
- [ ] Create account at https://resend.com
- [ ] Add domain `revorax.com` and verify DNS records
- [ ] Create API key

### 6. OpenRouter
- [ ] Create account at https://openrouter.ai
- [ ] Add $5 credits (start small)
- [ ] Create API key

### 7. Groq
- [ ] Create account at https://console.groq.com
- [ ] Create API key (free tier is generous)

### 8. After Deploy
- [ ] Run database migrations: `alembic upgrade head`
- [ ] Hit /health endpoint to verify backend is running
- [ ] Test CTA form submission on landing page
- [ ] Create first user account via API
- [ ] Provision first Twilio number via API
- [ ] Make a test call to the number
- [ ] Verify auto-text arrives on your phone
- [ ] Reply to auto-text and verify AI response
- [ ] Check database for lead creation

### 9. Monitoring
- [ ] Sentry alerts set up for errors
- [ ] Railway logs accessible
- [ ] Vercel deployment logs accessible
