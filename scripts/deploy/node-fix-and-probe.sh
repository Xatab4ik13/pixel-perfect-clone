#!/usr/bin/env bash
set -euo pipefail
CFG=/etc/telemt/telemt.toml
TS=$(date +%Y%m%d-%H%M%S)
BAK=/etc/telemt/telemt.toml.bak.$TS

echo "== backup -> $BAK =="
cp -a "$CFG" "$BAK"
ls -la "$CFG" "$BAK"

echo "== allow telemt to persist its config =="
chown telemt:telemt "$CFG"
chmod 0600 "$CFG"
ls -la "$CFG"

echo "== API create temp user =="
U=zz_lazeyka_probe
curl -s -w '\n[HTTP %{http_code}]\n' -X POST http://127.0.0.1:9091/v1/users \
  -H 'content-type: application/json' \
  -d "{\"username\":\"$U\",\"max_unique_ips\":2,\"expiration_rfc3339\":\"2030-01-01T00:00:00Z\"}" \
  | sed -E 's/("secret"[[:space:]]*:[[:space:]]*")[0-9a-f]+/\1***MASKED***/g'

echo
echo "== DIFF of config (masked secrets) old(bak) vs new =="
MASK='s/=[[:space:]]*"?[0-9a-f]{16,}"?/= ***MASKED***/g'
diff <(sed -E "$MASK" "$BAK") <(sed -E "$MASK" "$CFG") || true

echo
echo "== telemt still healthy? =="
systemctl is-active telemt
ss -tlnp 2>/dev/null | grep -E ':443|:9091' | sed -E 's/users:.*//'
