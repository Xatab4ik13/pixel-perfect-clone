#!/usr/bin/env bash
set -euo pipefail

PASS_FILE=/root/lazeyka.dbpass
if [ ! -s "$PASS_FILE" ]; then
  openssl rand -hex 24 > "$PASS_FILE"
  chmod 600 "$PASS_FILE"
fi
PASS=$(cat "$PASS_FILE")

sudo -u postgres psql -v ON_ERROR_STOP=1 -c \
  "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='lazeyka') THEN CREATE ROLE lazeyka LOGIN PASSWORD '$PASS'; ELSE ALTER ROLE lazeyka LOGIN PASSWORD '$PASS'; END IF; END \$\$;"

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='lazeyka'" | grep -q 1; then
  sudo -u postgres createdb -O lazeyka lazeyka
fi

# Build DATABASE_URL and store it where the app env will read it from.
echo "postgresql://lazeyka:$PASS@127.0.0.1:5432/lazeyka" > /root/lazeyka.dburl
chmod 600 /root/lazeyka.dburl

# Verify connection works via TCP with password.
PGPASSWORD="$PASS" psql -h 127.0.0.1 -U lazeyka -d lazeyka -tAc "select 'db-ok', current_user, version();" | head -1
echo "DB ready (url stored at /root/lazeyka.dburl)"
