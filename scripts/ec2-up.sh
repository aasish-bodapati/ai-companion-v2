#!/usr/bin/env bash
set -euo pipefail

# Simple deploy helper for EC2 (Ubuntu). Run from repo root on the EC2 instance.
# Usage:
#   1) Edit docker-compose.prod.yml to set envs (SECRET_KEY, LLM_PROVIDER, LLM_API_KEY, CORS, etc.)
#   2) ./scripts/ec2-up.sh
#   3) Health:   curl http://localhost:8000/api/v1/utils/health
#   4) (Optional) Start nginx TLS proxy: docker compose --profile production -f docker-compose.prod.yml up -d nginx

compose_file="docker-compose.prod.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not installed. Install Docker and try again." >&2
  exit 1
fi

# Ensure compose v2 is available
if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 not found (docker compose). Please install docker compose plugin." >&2
  exit 1
fi

# Build slim backend (INSTALL_EXTRAS=false in compose file)
echo "[1/4] Building backend image (slim) ..."
docker compose -f "$compose_file" build --no-cache backend

# Start infra (db + redis)
echo "[2/4] Starting postgres and redis ..."
docker compose -f "$compose_file" up -d postgres redis

echo "Waiting for postgres to be healthy ..."
# Simple wait loop (compose has healthchecks)
for i in {1..30}; do
  if [ "$(docker inspect -f '{{.State.Health.Status}}' ai-companion-v2-postgres-1 2>/dev/null || echo starting)" = "healthy" ]; then
    break
  fi
  sleep 2
done

# Run migrations once
echo "[3/4] Running Alembic migrations ..."
docker compose -f "$compose_file" run --rm backend alembic upgrade head || true

# Start backend
echo "[4/4] Starting backend ..."
docker compose -f "$compose_file" up -d backend

echo "Done. Verify health: curl http://localhost:8000/api/v1/utils/health"
