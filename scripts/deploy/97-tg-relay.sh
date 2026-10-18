#!/usr/bin/env bash
set -euo pipefail
cd /opt/lazeyka/app
tar -xzf /tmp/web-src.tgz && rm -f /tmp/web-src.tgz

echo "== systemd: telegram-relay =="
cat > /etc/systemd/system/telegram-relay.service <<'EOF'
[Unit]
Description=Telegram API relay (ssh -L via Amsterdam node)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/bin/ssh -N -i /root/.ssh/tg_relay -o StrictHostKeyChecking=accept-new -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ConnectTimeout=15 -L 127.0.0.1:8443:api.telegram.org:443 root@72.56.76.88
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable telegram-relay >/dev/null 2>&1 || true
systemctl restart telegram-relay
sleep 3
echo -n "relay active: "; systemctl is-active telegram-relay

echo "== env: BOT_API_RELAY + BOT_EGRESS =="
if grep -q '^BOT_API_RELAY=' .env; then sed -i 's#^BOT_API_RELAY=.*#BOT_API_RELAY=127.0.0.1:8443#' .env; else echo 'BOT_API_RELAY=127.0.0.1:8443' >> .env; fi
if grep -q '^BOT_EGRESS=' .env; then sed -i 's#^BOT_EGRESS=.*#BOT_EGRESS=1#' .env; else echo 'BOT_EGRESS=1' >> .env; fi
grep -E '^(BOT_API_RELAY|BOT_EGRESS|BOT_USERNAME)=' .env

echo "== build =="
export NITRO_PRESET=node-server
export NODE_OPTIONS=--max-old-space-size=1536
npm install --no-audit --no-fund
npm run build
systemctl restart lazeyka
sleep 3
echo -n "lazeyka active: "; systemctl is-active lazeyka
curl -s -o /dev/null -w 'home=%{http_code}\n' http://127.0.0.1:3000/
echo DONE
