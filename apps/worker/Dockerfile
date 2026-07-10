FROM node:20-alpine AS worker-base
RUN npm i -g pnpm@9
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/database/package.json packages/database/
COPY packages/shared/package.json packages/shared/
COPY packages/ai/package.json packages/ai/
COPY packages/whatsapp/package.json packages/whatsapp/
COPY packages/email/package.json packages/email/
COPY apps/worker/package.json apps/worker/

RUN pnpm install --frozen-lockfile

COPY packages/ packages/
COPY apps/worker/ apps/worker/

RUN pnpm --filter @revorax/database exec prisma generate
RUN pnpm --filter @revorax/worker run build

CMD ["node", "apps/worker/dist/main.js"]
