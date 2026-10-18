#!/usr/bin/env bash
set -euo pipefail
cd /opt/lazeyka/app
TOKEN=$(grep -E '^TELEGRAM_BOT_TOKEN=' .env | cut -d= -f2- | tr -d '\r')

# Open a temporary tunnel: 127.0.0.1:8443 -> (node) -> api.telegram.org:443
ssh -i /root/.ssh/tg_relay \
    -o StrictHostKeyChecking=accept-new \
    -o ExitOnForwardFailure=yes \
    -o ServerAliveInterval=20 \
    -fN -L 127.0.0.1:8443:api.telegram.org:443 root@72.56.76.88

sleep 2
echo "--- getMe via relay ---"
curl -sS -m 20 --connect-to api.telegram.org:443:127.0.0.1:8443 \
  "https://api.telegram.org/bot${TOKEN}/getMe" -w '\nHTTP=%{http_code}\n' || echo "curl failed"

# Tear down the temporary tunnel.
pkill -f 'ssh -i /root/.ssh/tg_relay' || true
echo "DONE"
