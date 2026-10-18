#!/usr/bin/env bash
# Interactive first-admin creation. Reads token from .env, password is hidden.
set -euo pipefail
cd /opt/lazeyka/app
TOKEN=$(grep -E '^ADMIN_BOOTSTRAP_TOKEN=' .env | cut -d= -f2-)
if [ -z "${TOKEN:-}" ]; then echo "no ADMIN_BOOTSTRAP_TOKEN in .env"; exit 1; fi
read -r -p 'Admin email: ' EM
read -r -s -p 'Admin password: ' PW; echo
read -r -s -p 'Repeat password: ' PW2; echo
if [ "$PW" != "$PW2" ]; then echo 'passwords do not match'; exit 1; fi
RESP=$(curl -s -X POST http://127.0.0.1:3000/api/admin/bootstrap \
  -H 'content-type: application/json' \
  --data-raw "$(printf '{"email":%s,"password":%s,"token":%s}' \
    "$(printf '%s' "$EM" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))')" \
    "$(printf '%s' "$PW" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))')" \
    "$(printf '%s' "$TOKEN" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))')")")
echo "$RESP"
case "$RESP" in
  *'"ok":true'*) echo 'Admin created. Login at https://lazeyka.hhr.pro/admin' ;;
  *) echo 'Failed (see response above).' ;;
esac
