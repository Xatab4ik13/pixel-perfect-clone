#!/usr/bin/env bash
set +e
U=zz_lazeyka_probe
MASK='s/("secret"[[:space:]]*:[[:space:]]*")[0-9a-f]+/\1***MASKED***/g'
echo '== POST /v1/users (create) =='
curl -s -w '\n[HTTP %{http_code}]\n' -X POST http://127.0.0.1:9091/v1/users \
  -H 'content-type: application/json' \
  -d "{\"username\":\"$U\",\"max_unique_ips\":2,\"expiration_rfc3339\":\"2030-01-01T00:00:00Z\"}" \
  | sed -E "$MASK"
echo
echo '== GET /v1/users/'$U' =='
curl -s -w '\n[HTTP %{http_code}]\n' http://127.0.0.1:9091/v1/users/$U | sed -E "$MASK"
echo
echo '== DELETE =='
curl -s -o /dev/null -w 'delete -> HTTP %{http_code}\n' -X DELETE http://127.0.0.1:9091/v1/users/$U
curl -s -o /dev/null -w 'get after delete -> HTTP %{http_code}\n' http://127.0.0.1:9091/v1/users/$U
