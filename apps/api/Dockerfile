# ─── API ──────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS api-base
RUN npm i -g pnpm@9
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/database/package.json packages/database/
COPY packages/shared/package.json packages/shared/
COPY packages/auth/package.json packages/auth/
COPY packages/ai/package.json packages/ai/
COPY packages/whatsapp/package.json packages/whatsapp/
COPY packages/email/package.json packages/email/
COPY packages/billing/package.json packages/billing/
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile

COPY packages/ packages/
COPY apps/api/ apps/api/

RUN pnpm --filter @revorax/database exec prisma generate
RUN pnpm --filter @revorax/api run build

EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
