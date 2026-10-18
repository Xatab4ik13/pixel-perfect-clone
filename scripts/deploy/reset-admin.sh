#!/usr/bin/env bash
set -euo pipefail
cd /opt/lazeyka/app
URL=$(cat /root/lazeyka.dburl)
psql "$URL" -c "delete from admin_users;" >/dev/null
BT=$(grep '^ADMIN_BOOTSTRAP_TOKEN=' .env | cut -d= -f2- | tr -d '\r')

python3 - "$BT" <<'PY'
import json,sys,urllib.request,urllib.error
tok=sys.argv[1]
data=json.dumps({"email":"ez4boost@gmail.com","password":"Ez360811632","token":tok}).encode()
req=urllib.request.Request("http://127.0.0.1:3000/api/admin/bootstrap",data=data,headers={"content-type":"application/json"})
try:
    r=urllib.request.urlopen(req); print('bootstrap', r.status, r.read().decode())
except urllib.error.HTTPError as e:
    print('bootstrap', e.code, e.read().decode())
PY

python3 - <<'PY'
import json,urllib.request,urllib.error
data=json.dumps({"email":"ez4boost@gmail.com","password":"Ez360811632"}).encode()
req=urllib.request.Request("http://127.0.0.1:3000/api/admin/login",data=data,headers={"content-type":"application/json"})
try:
    r=urllib.request.urlopen(req); print('login', r.status, r.read().decode())
except urllib.error.HTTPError as e:
    print('login', e.code, e.read().decode())
PY
