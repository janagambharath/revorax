# syntax=docker/dockerfile:1

# Build the Next.js application with the exact lockfile committed to the repo.
FROM node:22-bookworm-slim AS frontend-builder

WORKDIR /app/frontend
ENV NEXT_TELEMETRY_DISABLED=1

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# Railway runs one public process, so the final image contains both runtimes:
# Next.js listens on Railway's PORT and FastAPI is available only on localhost.
# Keep the official Node runtime in the final image rather than copying a Node
# executable across base images; this preserves all runtime dependencies.
FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PYTHONPATH=/app/backend \
    PATH="/opt/venv/bin:/usr/local/bin:${PATH}"

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv gcc tini \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m venv /opt/venv

COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt \
    && rm /tmp/requirements.txt

# Next's standalone output includes the production modules it needs.
COPY --from=frontend-builder /app/frontend/.next/standalone /app/frontend
COPY --from=frontend-builder /app/frontend/.next/static /app/frontend/.next/static
COPY --from=frontend-builder /app/frontend/public /app/frontend/public

COPY backend/app /app/backend/app
COPY backend/alembic.ini /app/backend/alembic.ini
COPY backend/alembic /app/backend/alembic
COPY docker/start.sh /app/start.sh

RUN chmod +x /app/start.sh \
    && chown -R node:node /app

EXPOSE 3000
USER node
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/app/start.sh"]
