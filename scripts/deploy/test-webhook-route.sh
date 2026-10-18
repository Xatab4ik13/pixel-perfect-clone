#!/usr/bin/env bash
set -euo pipefail
cd /opt/lazeyka/app
SECRET=$(grep -E '^BOT_WEBHOOK_SECRET=' .env | cut -d= -f2- | tr -d '\r')
URL=http://127.0.0.1:3000/api/tg/webhook

echo "== wrong secret -> expect 401 =="
curl -sS -o /dev/null -w 'HTTP=%{http_code}\n' -X POST "$URL" \
  -H 'content-type: application/json' \
  -H 'x-telegram-bot-api-secret-token: WRONG' \
  --data '{"message":{"chat":{"id":1},"text":"/start"}}'

echo "== correct secret + /start -> expect 200 (routing ok; send may fail on bad token) =="
curl -sS -o /dev/null -w 'HTTP=%{http_code}\n' -X POST "$URL" \
  -H 'content-type: application/json' \
  -H "x-telegram-bot-api-secret-token: ${SECRET}" \
  --data '{"message":{"chat":{"id":8506787738},"text":"/start","from":{"first_name":"Test"}}}'

echo "== no secret header -> expect 401 =="
curl -sS -o /dev/null -w 'HTTP=%{http_code}\n' -X POST "$URL" \
  -H 'content-type: application/json' \
  --data '{"message":{"chat":{"id":1},"text":"/start"}}'
echo DONE
