#!/usr/bin/env bash
set -euo pipefail
cd /opt/lazeyka/app

tar -xzf /tmp/web-src.tgz && rm -f /tmp/web-src.tgz

# Remove any empty/placeholder bot lines from previous bad attempts
sed -i '/^BOT_WEBHOOK_SECRET=\s*$/d; /^BOT_USERNAME=\s*$/d' .env

# Telegram egress is blocked from the RU host -> short-circuit outbound bot calls.
grep -q '^BOT_EGRESS=' .env || echo "BOT_EGRESS=0" >> .env

if ! grep -q '^BOT_WEBHOOK_SECRET=' .env; then
  echo "BOT_WEBHOOK_SECRET=$(openssl rand -hex 24)" >> .env
fi

# Telegram API is blocked from RU host, so username is set explicitly (validated via node getMe).
UNAME="t_lazeyka_bot"
if ! grep -q '^BOT_USERNAME=' .env; then
  echo "BOT_USERNAME=${UNAME}" >> .env
fi
echo "BOT_USERNAME=${UNAME}"

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
curl -s -o /dev/null -w 'root HTTP %{http_code}\n' http://127.0.0.1:3000/
curl -s -o /dev/null -w 'config HTTP %{http_code}\n' http://127.0.0.1:3000/api/config
echo "DONE"
