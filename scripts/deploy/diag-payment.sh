#!/usr/bin/env bash
set -euo pipefail
cd /opt/lazeyka/app
DBURL=$(grep -E '^DATABASE_URL=' .env | cut -d= -f2-)

echo "===== last 10 payments ====="
psql "$DBURL" -x -c "select id, user_id, plan_id, amount_kopecks, provider, provider_payment_id, status, days_granted, created_at, paid_at from public.payments order by created_at desc limit 10;"

echo "===== subscriptions ====="
psql "$DBURL" -x -c "select user_id, status, plan_id, current_period_end, telemt_username, (link is not null) as has_link from public.subscriptions order by updated_at desc limit 5;"

echo "===== nginx: webhook hits (pay) ====="
grep -F '/api/pay' /var/log/nginx/access.log 2>/dev/null | tail -20 || echo "(no pay lines in access.log)"

echo "===== app log: payment/webhook/raif (last 60) ====="
journalctl -u lazeyka --no-pager -n 400 2>/dev/null | grep -iE 'pay|webhook|raif|signature|telemt|referral' | tail -60 || echo "(none)"

echo "===== env (payment-related, masked) ====="
grep -E '^(PAYMENT_PROVIDER|PAYMENT_API_URL|PAYMENT_MERCHANT_ID|PUBLIC_BASE_URL)=' .env
grep -qE '^PAYMENT_SECRET=.+' .env && echo "PAYMENT_SECRET=SET" || echo "PAYMENT_SECRET=MISSING"
