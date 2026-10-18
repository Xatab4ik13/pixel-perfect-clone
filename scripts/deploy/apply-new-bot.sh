#!/usr/bin/env bash
# Applies a NEW bot token end-to-end. Reads /root/newbot.env:
#   TG_TOKEN=<token>
#   TG_USERNAME=<username without @>
#   TEST_CHAT_ID=<optional telegram id to receive a test message>
set -euo pipefail
cd /opt/lazeyka/app

[ -f /root/newbot.env ] || { echo "missing /root/newbot.env"; exit 1; }
# shellcheck disable=SC1091
source /root/newbot.env
: "${TG_TOKEN:?set TG_TOKEN}"
: "${TG_USERNAME:?set TG_USERNAME}"

RELAY=(--connect-to api.telegram.org:443:127.0.0.1:8443)
API="https://api.telegram.org/bot${TG_TOKEN}"

echo "== validate token (getMe via relay) =="
ME=$(curl -sS -m 20 "${RELAY[@]}" "${API}/getMe")
echo "$ME"
echo "$ME" | grep -q '"ok":true' || { echo "TOKEN INVALID — aborting, .env untouched"; exit 1; }

echo "== update .env (TELEGRAM_BOT_TOKEN + BOT_USERNAME) =="
cp .env ".env.bak.$(date +%s)"
grep -v -E '^(TELEGRAM_BOT_TOKEN|BOT_USERNAME)=' .env > .env.tmp
echo "TELEGRAM_BOT_TOKEN=${TG_TOKEN}" >> .env.tmp
echo "BOT_USERNAME=${TG_USERNAME}" >> .env.tmp
mv .env.tmp .env
chmod 600 .env

echo "== restart app =="
systemctl restart lazeyka
sleep 3
echo -n "lazeyka: "; systemctl is-active lazeyka

BASE=$(grep -E '^PUBLIC_BASE_URL=' .env | cut -d= -f2-)
SECRET=$(grep -E '^BOT_WEBHOOK_SECRET=' .env | cut -d= -f2-)

echo "== setWebhook =="
curl -sS -m 20 "${RELAY[@]}" "${API}/setWebhook" \
  --data-urlencode "url=${BASE}/api/tg/webhook" \
  --data-urlencode "secret_token=${SECRET}" \
  --data-urlencode 'allowed_updates=["message"]' \
  --data-urlencode 'drop_pending_updates=true'; echo

echo "== setChatMenuButton (web_app) =="
curl -sS -m 20 "${RELAY[@]}" "${API}/setChatMenuButton" \
  --data-urlencode "menu_button={\"type\":\"web_app\",\"text\":\"Открыть\",\"web_app\":{\"url\":\"${BASE}\"}}"; echo

echo "== getWebhookInfo =="
curl -sS -m 20 "${RELAY[@]}" "${API}/getWebhookInfo"; echo

if [ -n "${TEST_CHAT_ID:-}" ]; then
  echo "== sendMessage test -> ${TEST_CHAT_ID} =="
  curl -sS -m 20 "${RELAY[@]}" "${API}/sendMessage" \
    --data-urlencode "chat_id=${TEST_CHAT_ID}" \
    --data-urlencode "text=Лазейка на связи ✅"; echo
fi

echo "== cleanup secrets file =="
shred -u /root/newbot.env 2>/dev/null || rm -f /root/newbot.env
echo DONE
