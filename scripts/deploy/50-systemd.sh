#!/usr/bin/env bash
set -euo pipefail

cat > /etc/systemd/system/lazeyka.service <<'EOF'
[Unit]
Description=Lazeyka Telegram Mini App
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
WorkingDirectory=/opt/lazeyka/app
EnvironmentFile=/opt/lazeyka/app/.env
Environment=HOST=127.0.0.1
ExecStart=/usr/bin/node /opt/lazeyka/app/.output/server/index.mjs
Restart=always
RestartSec=3
# basic hardening
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable lazeyka
systemctl restart lazeyka
sleep 3
systemctl --no-pager --full status lazeyka | head -12
echo '--- local probe ---'
curl -s -o /dev/null -w 'HTTP %{http_code}\n' http://127.0.0.1:3000/ || true
curl -s -o /dev/null -w 'plans HTTP %{http_code}\n' http://127.0.0.1:3000/api/plans || true
