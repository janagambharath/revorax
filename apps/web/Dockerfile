FROM node:20-alpine AS web-base
RUN npm i -g pnpm@9
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/auth/package.json packages/auth/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile

COPY packages/shared/ packages/shared/
COPY packages/auth/ packages/auth/
COPY apps/web/ apps/web/

RUN pnpm --filter @revorax/web run build

EXPOSE 3000
CMD ["pnpm", "--filter", "@revorax/web", "start"]
