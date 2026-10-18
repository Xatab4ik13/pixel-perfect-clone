#!/usr/bin/env bash
set -euo pipefail
cd /opt/lazeyka/app
set -a; . ./.env; set +a
URL=$(cat /root/lazeyka.dburl)
TG=777000222
ORDER="e2e-order-$(date +%s)"

echo "== seed user + subscription + pending payment =="
psql "$URL" -v ON_ERROR_STOP=1 -c "insert into users (telegram_user_id, username, first_name) values ($TG,'webhook_test','Вебхук') on conflict (telegram_user_id) do update set username=excluded.username;" >/dev/null
USER_ID=$(psql "$URL" -tAc "select id from users where telegram_user_id=$TG")
psql "$URL" -v ON_ERROR_STOP=1 -c "insert into subscriptions (user_id, status) values ('$USER_ID','pending') on conflict (user_id) do nothing;" >/dev/null
psql "$URL" -v ON_ERROR_STOP=1 -c "insert into payments (user_id, plan_id, amount_kopecks, provider, provider_payment_id, status, days_granted) values ('$USER_ID','month',19900,'raif','$ORDER','pending',30);" >/dev/null
echo "user_id=$USER_ID order=$ORDER"

echo "== POST signed webhook (SUCCESS) =="
DATEV="2026-10-16T16:00:00+03:00"
python3 - "$PAYMENT_SECRET" "$PAYMENT_MERCHANT_ID" "$ORDER" "$DATEV" <<'PY'
import sys,hmac,hashlib,json,urllib.request,urllib.error
secret,pub,order,datev=sys.argv[1:5]
body=json.dumps({"event":"PAYMENT","data":{"id":"pay-x","publicId":pub,"amount":199,"order":{"id":order},"status":{"value":"SUCCESS","date":datev}}})
control="|".join(["199",pub,order,"SUCCESS",datev])
sig=hmac.new(secret.encode(),control.encode(),hashlib.sha256).hexdigest()
req=urllib.request.Request("http://127.0.0.1:3000/api/pay/webhook",data=body.encode(),
    headers={"content-type":"application/json","X-Api-Signature-SHA256":sig})
try:
    r=urllib.request.urlopen(req); print("webhook",r.status,r.read().decode())
except urllib.error.HTTPError as e:
    print("webhook",e.code,e.read().decode())
PY

echo "== resulting state =="
psql "$URL" -c "select p.status as pay, s.status as sub, (s.link is not null) as has_link, s.current_period_end from payments p join subscriptions s on s.user_id=p.user_id where p.provider_payment_id='$ORDER';"
echo -n "telemt user u$TG on node -> "; curl -s -o /dev/null -w 'HTTP %{http_code}\n' "http://127.0.0.1:9091/v1/users/u$TG"
