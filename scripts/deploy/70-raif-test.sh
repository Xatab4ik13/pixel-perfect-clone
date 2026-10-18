#!/usr/bin/env bash
set -euo pipefail
ENV=/opt/lazeyka/app/.env

# 1. set merchant publicId
sed -i 's|^PAYMENT_MERCHANT_ID=.*|PAYMENT_MERCHANT_ID=MB0002844756|' "$ENV"
grep '^PAYMENT_MERCHANT_ID=' "$ENV"

# 2. restart service with new config
systemctl restart lazeyka
sleep 2
systemctl is-active lazeyka

# 3. verify credentials by creating a tiny NEW (unpaid) order directly at Raiffeisen
set -a; . "$ENV"; set +a
OID="test-$(date +%s)"
echo "== create order $OID (10 RUB) =="
curl -s -w '\nHTTP %{http_code}\n' -X POST \
  "$PAYMENT_API_URL/v1/merchants/$PAYMENT_MERCHANT_ID/orders" \
  -H "authorization: Bearer $PAYMENT_SECRET" \
  -H 'content-type: application/json' \
  -d "{\"id\":\"$OID\",\"amount\":10,\"comment\":\"Lazeyka test\",\"returnUrls\":{\"successUrl\":\"https://lazeyka.hhr.pro/access\",\"failUrl\":\"https://lazeyka.hhr.pro/access\"}}"
