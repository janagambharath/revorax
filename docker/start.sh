#!/bin/sh

set -eu

backend_pid=""
frontend_pid=""
worker_pid=""

shutdown() {
  if [ -n "$frontend_pid" ]; then
    kill -TERM "$frontend_pid" 2>/dev/null || true
  fi

  if [ -n "$backend_pid" ]; then
    kill -TERM "$backend_pid" 2>/dev/null || true
  fi

  if [ -n "$worker_pid" ]; then
    kill -TERM "$worker_pid" 2>/dev/null || true
  fi
}

stop_requested() {
  shutdown
  wait "$backend_pid" 2>/dev/null || true
  wait "$frontend_pid" 2>/dev/null || true
  wait "$worker_pid" 2>/dev/null || true
  exit 143
}

trap stop_requested INT TERM

cd /app/backend
alembic -c alembic.ini upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8000 &
backend_pid=$!

# Durable workflow work (CRM delivery, reminders, follow-ups) must not run in
# a Twilio webhook request.  The worker shares Postgres with the API and is
# supervised with the other two processes in this single Railway service.
python -m app.workers.runner &
worker_pid=$!

cd /app/frontend
HOSTNAME=0.0.0.0 PORT="${PORT:-3000}" node server.js &
frontend_pid=$!

# If either process stops, terminate the other process so Railway can restart
# the service instead of leaving a partial application running.
while kill -0 "$backend_pid" 2>/dev/null && kill -0 "$frontend_pid" 2>/dev/null && kill -0 "$worker_pid" 2>/dev/null; do
  sleep 1
done

status=1

if ! kill -0 "$backend_pid" 2>/dev/null; then
  if wait "$backend_pid"; then
    :
  else
    status=$?
  fi
fi

if ! kill -0 "$frontend_pid" 2>/dev/null; then
  if wait "$frontend_pid"; then
    :
  else
    status=$?
  fi
fi

if ! kill -0 "$worker_pid" 2>/dev/null; then
  if wait "$worker_pid"; then
    :
  else
    status=$?
  fi
fi

shutdown
wait "$backend_pid" 2>/dev/null || true
wait "$frontend_pid" 2>/dev/null || true
wait "$worker_pid" 2>/dev/null || true

exit "$status"
