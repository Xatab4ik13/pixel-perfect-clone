#!/usr/bin/env bash
set -euo pipefail
AK=/root/.ssh/authorized_keys
cp -a "$AK" "$AK.bak.$(date +%s)"
# Add proper quotes around the permitopen value if missing.
sed -i -E 's#permitopen=127\.0\.0\.1:9091#permitopen="127.0.0.1:9091"#g' "$AK"
echo '== resulting telemt line (key masked) =='
grep 'lazeyka-web' "$AK" | sed -E 's/AAAA[A-Za-z0-9+/]+/AAAA...KEY.../g'
