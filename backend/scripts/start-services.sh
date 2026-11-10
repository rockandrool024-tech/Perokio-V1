#!/bin/bash
# Start PostgreSQL and Redis for the Perokio backend
# Usage: bash scripts/start-services.sh

export PATH="$HOME/pg-install/usr/lib/postgresql/17/bin:$HOME/redis-install/bin:$PATH"
export LD_LIBRARY_PATH="$HOME/pg-install/usr/lib/postgresql/17/lib:${LD_LIBRARY_PATH:-}"

# Start PostgreSQL if not running
if ! pg_ctl -D ~/pgdata status >/dev/null 2>&1; then
  echo "Starting PostgreSQL..."
  pg_ctl -D ~/pgdata -l ~/pgdata/postgres.log start -w 2>&1
else
  echo "PostgreSQL already running"
fi

# Start Redis if not running
if ! redis-cli ping >/dev/null 2>&1; then
  echo "Starting Redis..."
  redis-server --port 6379 --daemonize yes --save "" --appendonly no 2>/dev/null
  sleep 1
else
  echo "Redis already running"
fi

# Verify
PG_OK=$(psql -h localhost -p 5432 -U postgres -tAc "SELECT 1" 2>/dev/null)
REDIS_OK=$(redis-cli ping 2>/dev/null)

echo "---"
echo "PostgreSQL: ${PG_OK:+OK}${PG_OK:-FAIL}"
echo "Redis: ${REDIS_OK:-FAIL}"

# Create perokio database if it doesn't exist
psql -h localhost -p 5432 -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='perokio'" | grep -q 1 || \
  psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE perokio" 2>/dev/null

echo "Database perokio: ready"
