#!/bin/bash
# Start all backend services + API + worker
# Usage: bash scripts/start-all.sh

export PATH="$HOME/pg-install/usr/lib/postgresql/17/bin:$HOME/redis-install/bin:$PATH"
export LD_LIBRARY_PATH="$HOME/pg-install/usr/lib/postgresql/17/lib:${LD_LIBRARY_PATH:-}"

# Start PostgreSQL
if ! pg_ctl -D ~/pgdata status >/dev/null 2>&1; then
  echo "Starting PostgreSQL..."
  pg_ctl -D ~/pgdata -l ~/pgdata/postgres.log start -w 2>&1
else
  echo "PostgreSQL already running"
fi

# Start Redis
if ! redis-cli ping >/dev/null 2>&1; then
  echo "Starting Redis..."
  redis-server --port 6379 --daemonize yes --save "" --appendonly no 2>/dev/null
  sleep 1
else
  echo "Redis already running"
fi

# Verify
PG_OK=$(psql -h localhost -p 5432 -U postgres -tAc "SELECT 1" perokio 2>/dev/null)
REDIS_OK=$(redis-cli ping 2>/dev/null)
echo "PostgreSQL: ${PG_OK:+OK}${PG_OK:-FAIL}"
echo "Redis: ${REDIS_OK:-FAIL}"

# Find the ts-node binary (pnpm store location varies)
TS_NODE=$(find /home/z/my-project/backend/node_modules/.pnpm -name "ts-node" -path "*/node_modules/.bin/*" -type f 2>/dev/null | head -1)
if [ -z "$TS_NODE" ]; then
  echo "ERROR: ts-node binary not found"
  exit 1
fi
echo "ts-node: $TS_NODE"

# Kill old API if running
if [ -f /tmp/api.pid ]; then
  kill $(cat /tmp/api.pid 2>/dev/null) 2>/dev/null
  sleep 2
fi

# Start the API
cd /home/z/my-project/backend/apps/api
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/perokio?schema=public"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="perokio-dev-secret-change-in-production"
export PORT=4000

python3 -c "
import subprocess, os
log = open('/tmp/api.log', 'w')
env = {**os.environ}
proc = subprocess.Popen(
    ['$TS_NODE', 'src/main.ts'],
    stdout=log, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL,
    cwd='/home/z/my-project/backend/apps/api',
    start_new_session=True, env=env,
)
open('/tmp/api.pid', 'w').write(str(proc.pid))
print(f'API started: PID {proc.pid}')
"
sleep 4
curl -s --max-time 3 http://localhost:4000/api/auth/me -o /dev/null -w "API (4000): HTTP %{http_code}\n" 2>&1
