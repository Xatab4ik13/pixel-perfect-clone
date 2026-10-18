#!/usr/bin/env bash
set -euo pipefail
ENV=/opt/lazeyka/app/.env
IFS= read -r BOT
IFS= read -r EMAIL
IFS= read -r PASS

python3 - "$BOT" <<'PY'
import re,sys
p='/opt/lazeyka/app/.env'
s=open(p).read()
s=re.sub(r'^TELEGRAM_BOT_TOKEN=.*$','TELEGRAM_BOT_TOKEN='+re.escape(sys.argv[1]).replace('\\','\\\\'),s,flags=re.M) if False else re.sub(r'^TELEGRAM_BOT_TOKEN=.*$','TELEGRAM_BOT_TOKEN='+sys.argv[1],s,flags=re.M)
open(p,'w').write(s)
print('bot token set:', 'yes' if '__SET_ME__' not in [l.split('=',1)[1] for l in s.splitlines() if l.startswith('TELEGRAM_BOT_TOKEN=')][0] else 'no')
PY

systemctl restart lazeyka
sleep 2
echo -n 'service: '; systemctl is-active lazeyka

BT=$(grep '^ADMIN_BOOTSTRAP_TOKEN=' "$ENV" | cut -d= -f2-)
python3 - "$EMAIL" "$PASS" "$BT" <<'PY'
import json,sys,urllib.request,urllib.error
email,pw,tok=sys.argv[1],sys.argv[2],sys.argv[3]
data=json.dumps({"email":email,"password":pw,"token":tok}).encode()
req=urllib.request.Request("http://127.0.0.1:3000/api/admin/bootstrap",data=data,headers={"content-type":"application/json"})
try:
    r=urllib.request.urlopen(req); print('bootstrap', r.status, r.read().decode())
except urllib.error.HTTPError as e:
    print('bootstrap', e.code, e.read().decode())
PY
