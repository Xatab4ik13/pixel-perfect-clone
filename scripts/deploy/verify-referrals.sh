#!/usr/bin/env bash
set -euo pipefail
cd /opt/lazeyka/app
DBURL=$(grep -E '^DATABASE_URL=' .env | cut -d= -f2-)
echo -n 'users.referral_code column: '
psql "$DBURL" -At -c "select column_name from information_schema.columns where table_name='users' and column_name='referral_code';"
echo -n 'referrals table: '
psql "$DBURL" -At -c "select to_regclass('public.referrals');"
echo 'user rows / with code:'
psql "$DBURL" -At -c "select count(*) as total, count(referral_code) as with_code from public.users;"
echo 'referrals_api_probe:'
curl -s -o /dev/null -w 'me/referrals(noauth)=%{http_code}\n' http://127.0.0.1:3000/api/me/referrals
