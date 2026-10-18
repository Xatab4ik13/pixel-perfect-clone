#!/usr/bin/env bash
set -euo pipefail
cd /opt/lazeyka/app

tar -xzf /tmp/web-src.tgz && rm -f /tmp/web-src.tgz

# Load DATABASE_URL from .env without exporting the whole file.
DBURL=$(grep -E '^DATABASE_URL=' .env | cut -d= -f2-)
if [ -z "$DBURL" ]; then echo "ERROR: DATABASE_URL missing"; exit 1; fi

echo "== apply migration 0003_referrals =="
psql "$DBURL" -v ON_ERROR_STOP=1 -f drizzle/migrations/0003_referrals.sql
echo "== verify schema =="
psql "$DBURL" -At -c "select column_name from information_schema.columns where table_name='users' and column_name='referral_code';"
psql "$DBURL" -At -c "select to_regclass('public.referrals');"

echo "== npm install =="
npm install --no-audit --no-fund
echo "== build (node-server) =="
export NITRO_PRESET=node-server
export NODE_OPTIONS=--max-old-space-size=1536
npm run build
ls -la .output/server/index.mjs
echo "== restart =="
systemctl restart lazeyka
sleep 3
systemctl is-active lazeyka
curl -s -o /dev/null -w 'home=%{http_code}\n' http://127.0.0.1:3000/
echo "DONE"
