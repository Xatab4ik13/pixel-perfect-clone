#!/usr/bin/env bash
set -euo pipefail
cd /opt/lazeyka/app
set -a; . ./.env; set +a
J=$(mktemp)

echo '== admin login =='
curl -s -c "$J" -X POST http://127.0.0.1:3000/api/admin/login \
  -H 'content-type: application/json' \
  -d '{"email":"ez4boost@gmail.com","password":"Ez360811632"}' \
  -w '\n[HTTP %{http_code}]\n'

echo '== find test user =='
USERS=$(curl -s -b "$J" 'http://127.0.0.1:3000/api/admin/users?q=ivan')
USER_ID=$(echo "$USERS" | python3 -c 'import sys,json
d=json.load(sys.stdin); us=d.get("users",[])
print(next((u["id"] for u in us if str(u.get("telegramUserId"))=="777000111" or u.get("username")=="ivan_test"), ""))')
echo "user id: ${USER_ID:-NOTFOUND}"
[ -n "$USER_ID" ] || { echo "raw users:"; echo "$USERS" | head -c 600; exit 1; }

echo '== grant 30 days (real telemt provisioning over tunnel) =='
curl -s -b "$J" -X POST "http://127.0.0.1:3000/api/admin/users/$USER_ID" \
  -H 'content-type: application/json' \
  -d '{"action":"grant","days":30,"reason":"e2e test"}' \
  -w '\n[HTTP %{http_code}]\n'

echo
echo '== verify key match (node vs DB), keys masked =='
NODE=$(curl -s http://127.0.0.1:9091/v1/users/u777000111)
OURLINK=$(psql "$DATABASE_URL" -tAc "select link from subscriptions s join users u on u.id=s.user_id where u.telegram_user_id=777000111")
OURKEY=$(printf '%s' "$OURLINK" | grep -oE 'secret=ee[0-9a-f]{32}' | head -1 | sed 's/secret=ee//')
NODEKEY=$(printf '%s' "$NODE" | grep -oE 'secret=ee[0-9a-f]{32}' | head -1 | sed 's/secret=ee//')
echo "our link: $(printf '%s' "$OURLINK" | sed -E 's/secret=ee[0-9a-f]{32}/secret=ee<KEY>/')"
echo "node user ok: $(printf '%s' "$NODE" | grep -oE '\"ok\":[a-z]+' | head -1)"
echo "our key  sha12: $(printf '%s' "$OURKEY" | sha256sum | cut -c1-12)"
echo "node key sha12: $(printf '%s' "$NODEKEY" | sha256sum | cut -c1-12)"
if [ -n "$OURKEY" ] && [ "$OURKEY" = "$NODEKEY" ]; then echo 'RESULT: MATCH — link is live on the node'; else echo 'RESULT: MISMATCH'; fi
rm -f "$J"
